import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';
import { error, json } from '@sveltejs/kit';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
import { ForbiddenError } from '$lib/errors/Forbidden.js';
import { isSystem } from '$lib/utils/isSystem.js';
import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor.js';
import { articleConfig } from '$lib/components/editor/config/article.js';
import { EDITOR_IS_READONLY } from '$lib/constants/constants.js';
import { InvalidArticle } from '$lib/errors/InvalidArticle.js';
import { selectByCharacterRange } from '$lib/components/editor/utils/getSelection.js';
import { createRelativeRange } from '$lib/components/editor/utils/createRelativeRange.js';
import { encodeRelativePosition } from '$lib/yjs/utils.js';
import { _getYPostByTitle } from '../../read/[title]/+server.js';
import { createRange } from '$lib/db/range/create.js';
import { reactions } from '$lib/components/React/reactions/reactions.js';

const availableReactions = Object.keys(reactions);

export const POST = async ({ params, locals, request }) => {
	const { isBlocked, auth } = locals;

	if (isBlocked) {
		return ForbiddenError();
	}

	const session = await auth();
	if (!session?.user?.id || !session?.user?.name) {
		return ForbiddenError();
	}

	/**
	 * @param {number} openTime
	 * @param {number[]} offset
	 * @param {string} reaction
	 */
	const { openTime, offset, reaction } = await request.json();

	if (!availableReactions.includes(reaction)) {
		return error(400, "That reaction doesn't exist.");
	}

	// Biggest first.
	offset.sort();

	const { sanitized: title } = sanitizeTitle(params.title);

	let post;
	try {
		post = await _getYPostByTitle(title, new Date(openTime));
	} catch (err) {
		if (typeof err === 'number') {
			return error(err);
		}

		throw err;
	}

	if (isSystem(post)) {
		return ForbiddenError('This is a system article that cannot receive a reaction.');
	}

	const updateUntilTimestamp = base64ToUint8Array(post.update);

	try {
		const { editor, binding } = getYjsAndEditor(
			articleConfig(null, EDITOR_IS_READONLY, null),
			updateUntilTimestamp
		);

		const { anchor, focus } = editor.read(() => {
			const selection = selectByCharacterRange(editor, offset[0], offset[1]);

			if (!selection) {
				throw new Error('Could not find selection for reaction.');
			}

			const data = createRelativeRange(binding, selection);

			if (!data?.anchorPos || !data?.focusPos) {
				throw new Error(
					'Could not create relative offsets for the reaction. Try reloading the page.'
				);
			}

			return {
				anchor: uint8ArrayToBase64(encodeRelativePosition(data.anchorPos)),
				focus: uint8ArrayToBase64(encodeRelativePosition(data.focusPos)),
			};
		});

		const content = {
			reaction,
		};

		const { id } = await createRange(
			{ anchor, focus, content },
			{ user: { id: session.user.id }, post }
		);

		return json(id);
	} catch (err) {
		if (typeof err === 'string') {
			return InvalidArticle(err);
		}

		return error(400);
	}
};
