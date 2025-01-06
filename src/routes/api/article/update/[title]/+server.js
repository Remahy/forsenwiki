import { error, json } from '@sveltejs/kit';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';

import {
	diffUpdateUsingStateVector,
	encodeYDocToUpdateV2,
	getStateVectorFromUpdate,
	mergePostUpdates,
	postUpdatesToUint8Arr,
} from '$lib/yjs/utils';
import { ForbiddenError } from '$lib/errors/Forbidden';
import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor';
import { validateArticle } from '$lib/components/editor/validations';
import { InvalidArticle } from '$lib/errors/InvalidArticle';
import { getArticleURLIds } from '$lib/components/editor/utils/getEntities';
import { readSystemYPostRelations } from '$lib/db/article/read';
import { updateArticleYPost } from '$lib/db/article/update';
import { adjustAndUploadImages } from '$lib/components/editor/validations/images.server';
import { invalidateArticleCache } from '$lib/cloudflare.server';
import { upsertHTML } from '$lib/db/article/html';
import { articleConfig } from '$lib/components/editor/config/article';
import { adjustVideoEmbedNodeSiblings } from '$lib/components/editor/validations/videos.server';
import toHTML from '$lib/worker/toHTML';
import { EDITOR_IS_READONLY } from '$lib/constants/constants';
import { _getYPostByTitle } from '../../read/[title]/+server';
import { _emit } from '../../../../adonis/frontpage/+server';

export async function POST({ request, locals, params }) {
	if (locals.isBlocked) {
		return ForbiddenError();
	}

	const session = await locals.auth();
	if (!session?.user?.id || !session?.user?.name) {
		return ForbiddenError();
	}

	const { content } = await request.json();

	let post;
	try {
		post = await _getYPostByTitle(params.title);
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
	const stateVector = getStateVectorFromUpdate(currentUpdate);

	// Incoming update
	const [incomingUpdate] = postUpdatesToUint8Arr([{ content }]);

	// Diff the updates
	const initialDiff = diffUpdateUsingStateVector(incomingUpdate, stateVector);

	// We use this update to validate if the contents are valid.
	const combinedInitialUpdate = mergePostUpdates([currentUpdate, initialDiff]);

	let e;
	try {
		e = getYjsAndEditor(articleConfig(null, EDITOR_IS_READONLY, null), combinedInitialUpdate);
		const editor = e.editor;

		// Does not modify the editor.
		await validateArticle(editor);

		// Modifies the editor.
		await adjustAndUploadImages(editor, post.title, { id: session.user.id });
		await adjustVideoEmbedNodeSiblings(editor);
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
	const finalDiff = diffUpdateUsingStateVector(backendUpdate, stateVector);

	const combinedFinalDiff = mergePostUpdates([initialDiff, finalDiff]);

	const { byteLength } = combinedFinalDiff;

	// Total size of the YDoc with the new update.
	const { byteLength: totalByteLength } = mergePostUpdates([currentUpdate, combinedFinalDiff]);

	const systemRelations = await readSystemYPostRelations(post.id);

	const transformedSystemRelations = systemRelations.map((sysRelation) => ({
		isSystem: sysRelation.isSystem,
		toPostId: sysRelation.toPostId,
	}));

	const internalIds = await getArticleURLIds(editor);
	const outRelations = internalIds.map((mentionPostId) => ({
		isSystem: false,
		toPostId: mentionPostId,
	}));

	const contentBase64 = uint8ArrayToBase64(combinedFinalDiff);

	const body = { post, outRelations, transformedSystemRelations, content: contentBase64 };
	const metadata = {
		user: { id: session.user.id },
		byteLength,
		totalByteLength,
	};

	const updatedArticle = await updateArticleYPost(body, metadata);

	await upsertHTML(
		post.id,
		await toHTML({ config: 'article', content: JSON.stringify(editor.getEditorState().toJSON()) })
	);

	await invalidateArticleCache(post.title);

	_emit('article:update', {
		title: post.title,
		rawTitle: post.rawTitle,
		id: updatedArticle?.id,
		lastUpdated: updatedArticle?.createdTimestamp.toString(),
		author: session.user.name,
	});

	return json({ ...updatedArticle, title: post.title });
}
