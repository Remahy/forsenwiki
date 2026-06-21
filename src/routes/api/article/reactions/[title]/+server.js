import { base64ToUint8Array, uint8ArrayToBase64 } from 'uint8array-extras';
import { error, json } from '@sveltejs/kit';
import { sanitizeTitle } from '$lib/components/editor/utils/sanitizeTitle';
import { ForbiddenError } from '$lib/errors/Forbidden.js';
import { isSystem } from '$lib/utils/isSystem.js';
import { getYjsAndEditor } from '$lib/yjs/getYjsAndEditor.js';
import { articleConfig } from '$lib/components/editor/config/article.js';
import { EDITOR_IS_READONLY } from '$lib/constants/constants.js';
import { ArticleError } from '$lib/errors/ArticleError.js';
import {
	getGlobalOffsets,
	selectByCharacterRange,
} from '$lib/components/editor/utils/getSelection.js';
import { createAbsoluteRange, createRelativeRange } from '$lib/components/editor/utils/ranges.js';
import { decodeRelativePosition, encodeRelativePosition } from '$lib/yjs/utils.js';
import { _getYPostByTitle } from '../../read/[title]/+server.js';
import { createRange } from '$lib/db/range/create.js';
import { readRangesForYPost } from '$lib/db/range/read.js';
import { reactions } from '$lib/components/React/reactions/reactions.js';
import { $createRangeSelection as createRangeSelection } from 'lexical';

const availableReactions = Object.keys(reactions);

/**
 * @param {import('@prisma/client/runtime/client').JsonValue} data
 */
const getReactionData = (data) => {
	if (typeof data === 'object' && !(data instanceof Array) && typeof data?.reaction === 'string') {
		return {
			reaction: data.reaction,
		};
	}

	return null;
};

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
			return ArticleError(err);
		}

		return error(400);
	}
};

export const GET = async ({ params }) => {
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
		return ForbiddenError('This is a system article that cannot receive a reaction.');
	}

	const update = base64ToUint8Array(post.update);

	const ranges = await readRangesForYPost(post);

	let editor;
	let doc;

	try {
		const eYjs = getYjsAndEditor(articleConfig(null, EDITOR_IS_READONLY, null), update);
		editor = eYjs.editor;
		doc = eYjs.doc;
	} catch (err) {
		if (typeof err === 'string') {
			return ArticleError(err);
		}

		console.error(err);
		return error(400);
	}

	/**
	 * @type {Map<string, { [x: string]: Array<{ id: string, name: string, reactionId: string }> } >}
	 */
	let res = new Map();

	for (let index = 0; index < ranges.length; index++) {
		const range = ranges[index];

		const offsets = editor.read(() => {
			const decodedRelativeRanges = {
				anchor: decodeRelativePosition(base64ToUint8Array(range.anchor)),
				focus: decodeRelativePosition(base64ToUint8Array(range.focus)),
			};

			const absoluteRange = createAbsoluteRange(doc, decodedRelativeRanges);

			if (!absoluteRange) {
				return null;
			}

			const selection = createRangeSelection();
			selection.anchor.set(absoluteRange.anchorNode.getKey(), absoluteRange.anchorOffset, 'text');
			selection.focus.set(absoluteRange.focusNode.getKey(), absoluteRange.focusOffset, 'text');

			return getGlobalOffsets(selection);
		});

		if (!offsets) {
			continue;
		}

		const { start, end } = offsets;

		try {
			const key = `${start}-${end}`;
			let entry = res.get(key) || {};

			const data = getReactionData(range.content);

			if (data) {
				const entries = entry[data.reaction] || [];

				// @ts-ignore
				entries.push({ id: range.user.id, name: range.user.name, reactionId: range.id });

				entry[data.reaction] = entries;
			}

			res.set(key, entry);
		} catch (err) {
			console.error('Faulty reaction', JSON.stringify(range), err);
			continue;
		}
	}

	const reactions = Object.fromEntries([...res.entries()]);

	return json(reactions);
};
