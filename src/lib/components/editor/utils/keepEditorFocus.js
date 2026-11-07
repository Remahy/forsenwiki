/**
 * Use as `onmousedown` on toolbar buttons,
 * so clicking them doesn't take focus from the editor.
 * @param {MouseEvent} event
 */
export const keepEditorFocus = (event) => {
	event.preventDefault();
};
