import { error, json } from '@sveltejs/kit';
import { $getEditor as getEditor } from 'lexical';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';

import {
	diffUpdateUsingStateVectorV2,
	getStateVectorFromUpdateV2,
	mergePostUpdatesV2,
	postUpdatesToUint8Arr,
} from '$lib/y/utils';
import { ForbiddenError } from '$lib/errors/Forbidden';
import { getYAndEditor, isLegacyUpdate, readState } from '$lib/y/headless';
import { InvalidPost } from '$lib/errors/InvalidPost';
import { getInternalIds } from '$lib/components/editor/utils/getInternalIds';
import { readSystemYPostRelations, readYPostByTitle } from '$lib/db/post/read';
import { updatePostTitle, updatePost } from '$lib/db/post/update';
import { invalidatePostCache } from '$lib/cloudflare.server';
import { upsertHTML } from '$lib/db/post/html';
import { articleExtension } from '$lib/components/editor/config/article';
import toHTML from '$lib/worker/toHTML';
import {
	AVAILABLE_DISCLAIMER_TAGS,
	EDITOR_IS_READONLY,
	Y_POST_TYPES,
} from '$lib/constants/constants';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
import { isSystem } from '$lib/utils/isSystem';
import { getUniqueImageHashes } from '$lib/components/editor/utils/getImages';
import { validateUploads, pruneFailedUploads } from '$lib/s3/validateUploads.server';
import { serverRunValidations } from '$lib/components/editor/validations/index.server';
import { _getYPostByTitle } from '../../read/[title]/+server';
import { _migrateLegacyDraft } from '../../legacy-draft/+server';
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

	if (newTitle.toLowerCase().startsWith('user:')) {
		return error(400, '"User:" prefix can only be used for user bio.');
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

/**
 * @typedef {Object} UpdateBody
 * @property {string} content
 * @property {string | null} [newTitle] Skip if user is not moderator.
 * @property {string[]} [disclaimerTags]
 */

export async function POST({ request, locals, params }) {
	const { isBlocked, isModerator, auth } = locals;

	if (isBlocked) {
		return ForbiddenError();
	}

	/**
	 * @type {PartialErrors}
	 */
	const partialErrors = [];

	const session = await auth();
	if (!session?.user?.id || !session?.user?.name) {
		return ForbiddenError();
	}

	/** @type {UpdateBody} */
	const { content, disclaimerTags: disclaimerRawTags, ...rest } = await request.json();

	let { newTitle } = rest;

	const { sanitized: title } = sanitizeTitle(params.title);

	let post;
	try {
		post = await _getYPostByTitle(title);
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}

	if (isSystem(post)) {
		return ForbiddenError('This is a system post that cannot be edited.');
	}

	const systemRelations = await readSystemYPostRelations(post.id);

	if (systemRelations.some(({ toPostId }) => toPostId === Y_POST_TYPES.BIO)) {
		newTitle = null;

		if (post.originalAuthorId !== session.user.id) {
			return ForbiddenError("You're not allowed to edit someone else's bio.");
		}
	}

	// Current
	const currentUpdate = base64ToUint8Array(post.update);
	const stateVector = getStateVectorFromUpdateV2(currentUpdate);

	// Incoming update
	let [incomingUpdate] = postUpdatesToUint8Arr([{ content }]);

	if (isLegacyUpdate(incomingUpdate)) {
		// A tab that still runs the Yjs 13 editor: its changes are brought over.
		const migrated = await _migrateLegacyDraft(title, incomingUpdate);

		incomingUpdate = migrated
			? mergePostUpdatesV2([currentUpdate, /** @type {Uint8Array<ArrayBuffer>} */ (migrated)])
			: currentUpdate;
	}

	// Diff the updates
	const initialDiff = diffUpdateUsingStateVectorV2(incomingUpdate, stateVector);

	// We use this update to validate if the contents are valid.
	const combinedInitialUpdate = mergePostUpdatesV2([currentUpdate, initialDiff]);

	/** @type {ReturnType<typeof getYAndEditor>} */
	let article;
	try {
		article = getYAndEditor(
			articleExtension(null, EDITOR_IS_READONLY, null),
			combinedInitialUpdate
		);
		const editor = article.editor;

		await serverRunValidations(editor);

		const oldImageHashes = readState(
			articleExtension(null, EDITOR_IS_READONLY, null),
			currentUpdate,
			() => getUniqueImageHashes(getEditor())
		);
		const currentImageHashes = getUniqueImageHashes(editor).map((hash, index) => ({ index, hash }));
		const newHashes = currentImageHashes.filter(({ hash }) => !oldImageHashes.includes(hash));
		const failedUploads = await validateUploads(newHashes);
		// Remove failed uploads from database.
		await pruneFailedUploads(
			failedUploads.map(({ hash }) => hash),
			session.user.id
		);

		if (failedUploads.length) {
			throw `FAILED_UPLOADS: ${failedUploads.map(({ index }) => `Image index [${index + 1}] doesn't exist or failed to upload.`).join(' ')}`;
		}
	} catch (err) {
		if (typeof err === 'string') {
			return InvalidPost(err);
		}

		console.error(err);
		return error(400);
	}
	const { editor } = article;

	// By this point, we have probably modified the editor. Let's recreate a diff.
	const backendUpdate = await article.encodeV2();

	// Diff the updates
	// This is also what we save as a postUpdate
	const finalDiff = diffUpdateUsingStateVectorV2(backendUpdate, stateVector);

	const combinedFinalDiff = mergePostUpdatesV2([initialDiff, finalDiff]);

	const { byteLength } = combinedFinalDiff;

	// Total size of the YDoc with the new update.
	const { byteLength: totalByteLength } = mergePostUpdatesV2([currentUpdate, combinedFinalDiff]);

	const internalIds = getInternalIds(editor);
	const outRelations = internalIds.map((mentionPostId) => ({
		isSystem: false,
		toPostId: mentionPostId,
	}));

	const contentBase64 = uint8ArrayToBase64(combinedFinalDiff);

	/** @type {{ raw: string, sanitized: string } | undefined} */
	let potentialNewTitle =
		isModerator && newTitle ? await validateTitle(post, newTitle, partialErrors) : undefined;

	// Only moderators can change disclaimer tags. `undefined` leaves the current tags untouched.
	const disclaimerTags =
		isModerator && Array.isArray(disclaimerRawTags)
			? [...new Set(disclaimerRawTags.filter((tag) => AVAILABLE_DISCLAIMER_TAGS.includes(tag)))]
			: undefined;

	/** @type {import('$lib/db/post/update').UpdatePostData} */
	const body = { post, outRelations, disclaimerTags, content: contentBase64 };
	/** @type {import('$lib/db/post/update').UpdatePostMetadata} */
	const metadata = {
		user: { id: session.user.id },
		byteLength,
		totalByteLength,
		newTitle: potentialNewTitle?.raw,
		oldTitle: post.rawTitle,
	};

	const updatedPost = await updatePost(body, metadata);

	const { html, text, image } = await toHTML({
		config: 'article',
		content: JSON.stringify(editor.getEditorState().toJSON()),
	});

	article.dispose();

	await upsertHTML(post.id, { content: html, text, image });

	await invalidatePostCache(post.title);

	let _post = { title: post.title, rawTitle: post.rawTitle };

	if (potentialNewTitle) {
		_post = await updatePostTitle({ post, newTitle: potentialNewTitle });
	}

	_emit('post:update', {
		title: _post.title,
		rawTitle: _post.rawTitle,
		id: updatedPost?.id,
		lastUpdated: updatedPost?.createdTimestamp.toString(),
		byteLength,
		author: session.user.name,
		authorId: session.user.id,
	});

	return json({
		...updatedPost,
		title: _post.title,
		partialErrors: partialErrors.length ? partialErrors : undefined,
	});
}
