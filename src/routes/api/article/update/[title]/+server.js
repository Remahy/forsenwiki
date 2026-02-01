import { error, json } from '@sveltejs/kit';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';

import {
	diffUpdateUsingStateVectorV2,
	encodeYDocToUpdateV2,
	getStateVectorFromUpdateV2,
	mergePostUpdatesV2,
	postUpdatesToUint8Arr,
} from '$lib/yjs/utils';
import { ForbiddenError } from '$lib/errors/Forbidden';
import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import { validateArticle } from '$lib/components/editor/validations';
import { InvalidArticle } from '$lib/errors/InvalidArticle';
import { getInternalIds } from '$lib/components/editor/utils/getInternalIds';
import { readSystemYPostRelations, readYPostByTitle } from '$lib/db/article/read';
import { updateArticleTitle, updateArticleYPost } from '$lib/db/article/update';
import { adjustAndUploadImages } from '$lib/components/editor/validations/images.server';
import { invalidateArticleCache } from '$lib/cloudflare.server';
import { upsertHTML } from '$lib/db/article/html';
import { articleConfig } from '$lib/components/editor/config/article';
import { adjustVideoEmbedNodeSiblings } from '$lib/components/editor/validations/videos.server';
import toHTML from '$lib/worker/toHTML';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
import { adjustInternalLinks } from '$lib/components/editor/validations/internalLinks.server';
import { _getYPostByTitle } from '../../read/[title]/+server';
import { _emit } from '../../../adonis/frontpage/+server';

/**
 * @typedef {Array<{ code: string, field: string, value?: string }>} PartialErrors
 */

/**
 * @param {Awaited<ReturnType<_getYPostByTitle>>} post
 * @param {string} newTitle
 * @param {PartialErrors} partialErrors
 */
const validateTitle = async (post, newTitle, partialErrors) => {
	const isNewTitle = newTitle !== post.rawTitle;

	if (!isNewTitle) {
		return undefined;
	}

	const sanitizedTitle = sanitizeTitle(newTitle);
	if (!sanitizedTitle.sanitized) {
		partialErrors.push({
			code: newTitle.length ? 'ILLEGAL' : 'EMPTY',
			field: 'newTitle',
			value: newTitle,
		});
		return undefined;
	}

	const foundTitle = await readYPostByTitle(sanitizedTitle.sanitized);
	if (foundTitle) {
		partialErrors.push({ code: 'EXISTS', field: 'newTitle', value: newTitle });
		return undefined;
	}

	return sanitizedTitle;
};

export async function POST({ request, locals, params }) {
	/**
	 * @type {PartialErrors}
	 */
	const partialErrors = [];

	const { isBlocked, isModerator, auth } = locals;

	if (isBlocked) {
		return ForbiddenError();
	}

	const session = await auth();
	if (!session?.user?.id || !session?.user?.name) {
		return ForbiddenError();
	}

	/**
	 * @param {string} content
	 * @param {string} newTitle - Skip this if user is not moderator.
	 */
	const { content, newTitle } = await request.json();

	const { sanitized: title, raw: currentRawTitle } = sanitizeTitle(params.title);

	let post;
	try {
		post = await _getYPostByTitle(title);
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}

	const isSystem =
		post.outRelations.find(({ isSystem, toPostId }) => isSystem && toPostId === 'system') ||
		post.id === 'system';

	if (isSystem) {
		return ForbiddenError('This is a system article that cannot be edited.');
	}

	// Current
	const currentUpdate = base64ToUint8Array(post.update);
	const stateVector = getStateVectorFromUpdateV2(currentUpdate);

	// Incoming update
	const [incomingUpdate] = postUpdatesToUint8Arr([{ content }]);

	// Diff the updates
	const initialDiff = diffUpdateUsingStateVectorV2(incomingUpdate, stateVector);

	// We use this update to validate if the contents are valid.
	const combinedInitialUpdate = mergePostUpdatesV2([currentUpdate, initialDiff]);

	let e;
	try {
		e = getYjsAndEditor(articleConfig(null, EDITOR_IS_READONLY, null), combinedInitialUpdate);
		const editor = e.editor;

		// Does not modify the editor.
		validateArticle(editor);

		// Modifies the editor.
		await adjustAndUploadImages(editor, post.title, { id: session.user.id });
		await adjustVideoEmbedNodeSiblings(editor);
		await adjustInternalLinks(editor);
	} catch (err) {
		if (typeof err === 'string') {
			return InvalidArticle(err);
		}

		console.error(err);
		return error(400);
	}
	const { editor, doc } = e;

	// By this point, we have probably modified the editor. Let's recreate a diff.
	const backendUpdate = encodeYDocToUpdateV2(doc);

	// Diff the updates
	// This is also what we save as a postUpdate
	const finalDiff = diffUpdateUsingStateVectorV2(backendUpdate, stateVector);

	const combinedFinalDiff = mergePostUpdatesV2([initialDiff, finalDiff]);

	const { byteLength } = combinedFinalDiff;

	// Total size of the YDoc with the new update.
	const { byteLength: totalByteLength } = mergePostUpdatesV2([currentUpdate, combinedFinalDiff]);

	const systemRelations = await readSystemYPostRelations(post.id);

	const transformedSystemRelations = systemRelations.map((sysRelation) => ({
		isSystem: sysRelation.isSystem,
		toPostId: sysRelation.toPostId,
	}));

	const internalIds = getInternalIds(editor);
	const outRelations = internalIds.map((mentionPostId) => ({
		isSystem: false,
		toPostId: mentionPostId,
	}));

	const contentBase64 = uint8ArrayToBase64(combinedFinalDiff);

	/** @type {{ raw: string, sanitized: string } | undefined} */
	let potentialNewTitle = isModerator
		? await validateTitle(post, newTitle, partialErrors)
		: undefined;

	const body = { post, outRelations, transformedSystemRelations, content: contentBase64 };
	const metadata = {
		user: { id: session.user.id },
		byteLength,
		totalByteLength,
		newTitle: potentialNewTitle?.raw,
		oldTitle: currentRawTitle,
	};

	const updatedArticle = await updateArticleYPost(body, metadata);

	const { html, text, image } = await toHTML({
		config: 'article',
		content: JSON.stringify(editor.getEditorState().toJSON()),
	});

	await upsertHTML(post.id, { content: html, text, image });

	await invalidateArticleCache(post.title);

	let _post = { title: post.title, rawTitle: post.rawTitle };

	if (potentialNewTitle) {
		_post = await updateArticleTitle({ post, newTitle: potentialNewTitle });
	}

	_emit('article:update', {
		title: _post.title,
		rawTitle: _post.rawTitle,
		id: updatedArticle?.id,
		lastUpdated: updatedArticle?.createdTimestamp.toString(),
		byteLength,
		author: session.user.name,
	});

	return json({
		...updatedArticle,
		title: _post.title,
		partialErrors: partialErrors.length ? partialErrors : undefined,
	});
}
