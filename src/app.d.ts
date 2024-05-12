// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare global {
  export type LexicalEditor = import('lexical').LexicalEditor
	export type LexicalNode = import('lexical').LexicalNode

	export type Writable<T> = import('svelte/store').Writable<T>

	export type BaseSelection = import('lexical').BaseSelection
	export type RangeSelection = import('lexical').RangeSelection
	export type ElementNode = import('lexical').ElementNode

	export type ComposerWritable = Writable<{ getEditor: () => LexicalEditor} | null>
	export type Composer = import('svelte-lexical').Composer

	export type YDoc = import('yjs').Doc
	export type YEvent<T> = import('yjs').YEvent<T>

	export type YDOCPERSISTENCE = import('y-indexeddb').IndexeddbPersistence;
}


export {};
