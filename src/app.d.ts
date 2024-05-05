// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import {} from 'yjs'

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
  export type LexicalEditor = import('svelte-lexical').LexicalEditor

	export type Writable<T> = import('svelte/store').Writable<T>

	export type BaseSelection = import('lexical').BaseSelection
	export type ElementNode = import('lexical').ElementNode
}


export {};
