/**
 * Call before an update that moves the selection while focus is outside the editor (selects, buttons, modals).
 * Otherwise Lexical focuses the editor mid-commit, dispatching FOCUS_COMMAND from a read-only context, which warns.
 * @param {LexicalEditor} editor
 */
export const focusEditor = (editor) => {
	editor.getRootElement()?.focus({ preventScroll: true });
};

/**
 * Use as a modal's `onClose`. The modal closes in the same task as its `onSubmit`,
 * so this runs before that update commits (Lexical commits in a microtask), and also covers cancelling.
 * The native focus alone can put the caret at the start, editor.focus() puts the previous selection back.
 * @param {LexicalEditor} editor
 */
export const restoreEditorFocus = (editor) => {
	focusEditor(editor);
	editor.focus();
};
