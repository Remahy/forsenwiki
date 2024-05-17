import { error, json } from '@sveltejs/kit';
import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';
import { diffUpdateUsingStateVector, getStateVectorFromUpdate, mergePostUpdates, postUpdatesToUint8Arr } from '$lib/yjs/utils';
import { ForbiddenError } from '$lib/errors/Forbidden';
import { _getYPostByTitle } from '../../read/[title]/+server';
import { updateToJSON } from '$lib/yjs/updateToJSON';
import { articleConfig } from '$lib/components/editor/config/article';
import { validateArticle } from '$lib/components/editor/validations';
import { InvalidArticle } from '$lib/errors/InvalidArticle';
import { getArticleURLIds } from '$lib/components/editor/utils/getEntities';
import { readSystemYPostRelations } from '$lib/db/article/read';
import { updateArticleYPost } from '$lib/db/article/update';

export async function POST({ request, locals, params }) {
	const session = await locals.auth();
	if (!session || !session.user?.id) return ForbiddenError();

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
	const stateVector = getStateVectorFromUpdate(currentUpdate)

	// Incoming update
	const [incomingUpdate] = postUpdatesToUint8Arr([{ content }])

	// Diff the updates
	// This is also what we save as a postUpdate
	const diff = diffUpdateUsingStateVector(incomingUpdate, stateVector)

	// We use this update to validate if the contents are valid.
	const combinedUpdate = mergePostUpdates([currentUpdate, diff])

	let editor;
	try {
		editor = updateToJSON(articleConfig({}, false, null), combinedUpdate)

		await validateArticle(editor);
	} catch (err) {
		if (typeof err === 'string') {
			return InvalidArticle(err);
		}

		console.error(err);
		return error(400);
	}

	const systemRelations = await readSystemYPostRelations(post.id)

	const transformedSystemRelations = systemRelations.map((sysRelation) =>
		({ isSystem: sysRelation.isSystem, toPostId: sysRelation.toPostId })
	)

	const internalIds = await getArticleURLIds(editor)
	const outRelations = internalIds.map((mentionPostId) => ({
		isSystem: false,
		toPostId: mentionPostId
	}))

	const contentBase64 = uint8ArrayToBase64(diff)

	const body = { post, outRelations, transformedSystemRelations, content: contentBase64 }
	const updatedArticle = await updateArticleYPost({ userId: session.user.id }, body)

	return json({...updatedArticle, title: post.title })
}
