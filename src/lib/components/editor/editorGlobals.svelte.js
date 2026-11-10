export const editorGlobals = $state({
	articleId: '',
	/** Follows the editor's editable listener: read-only until the collaboration binding is active. */
	isEditable: false,
});
