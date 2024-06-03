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
import { articleConfig } from '$lib/components/editor/config/article';
import { validateArticle } from '$lib/components/editor/validations';
import { InvalidArticle } from '$lib/errors/InvalidArticle';
import { getArticleURLIds } from '$lib/components/editor/utils/getEntities';
import { readSystemYPostRelations } from '$lib/db/article/read';
import { updateArticleYPost } from '$lib/db/article/update';
import { validateAndUploadImages } from '$lib/components/editor/validations/images.server';
import { invalidateArticleCache } from '$lib/cloudflare.server';
import { upsertHTML } from '$lib/db/article/html';
import { toHTML } from '$lib/lexicalHTML';
import { _getYPostByTitle } from '../../read/[title]/+server';

export async function POST({ request, locals, params }) {
	if (locals.isBlocked) return ForbiddenError();

	const session = await locals.auth();
	if (!session?.user?.id || !session?.user?.name) return ForbiddenError();

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

	// Current
	const currentUpdate = base64ToUint8Array(post.update);
	const stateVector = getStateVectorFromUpdate(currentUpdate);

	// Incoming update
	const [incomingUpdate] = postUpdatesToUint8Arr([{ content }]);

	// Diff the updates
	const initialDiff = diffUpdateUsingStateVector(incomingUpdate, stateVector);

	// We use this update to validate if the contents are valid.
	const combinedUpdate = mergePostUpdates([currentUpdate, initialDiff]);

	let e;
	try {
		e = getYjsAndEditor(articleConfig(null, false, null), combinedUpdate);
		const editor = e.editor;

		// Does not modify the editor.
		await validateArticle(editor);

		// Modifies the editor.
		await validateAndUploadImages(editor, post.title, { id: session.user.id });
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

	const contentBase64 = uint8ArrayToBase64(finalDiff);

	const body = { post, outRelations, transformedSystemRelations, content: contentBase64 };
	const user = { name: session.user.name, id: session.user.id };

	const updatedArticle = await updateArticleYPost(body, user);

	await upsertHTML(post.id, await toHTML(editor));

	await invalidateArticleCache(post.title);

	return json({ ...updatedArticle, title: post.title });
}
