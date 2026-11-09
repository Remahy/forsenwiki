// Based on umaranis' svelte-lexical
import { mount, unmount } from 'svelte';
import { defineExtension } from '@lexical/extension';

/**
 * @typedef {{ componentClass: import('svelte').Component<any>, updateProps: (props: Record<string, any>) => void }} SvelteDecorator
 * @typedef {{ decorator: SvelteDecorator, element: HTMLElement, props: Record<string, any>, instance: Record<string, any> }} MountedDecorator
 */

/**
 * @param {LexicalEditor} editor
 * @param {Map<any, any>} context
 * @returns {() => void}
 */
export const registerSvelteDecorators = (editor, context) => {
	/** @type {Map<string, MountedDecorator>} */
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const mounted = new Map();

	/** @param {string} key */
	const remove = (key) => {
		const entry = mounted.get(key);
		if (entry) {
			mounted.delete(key);
			unmount(entry.instance);
		}
	};

	/** @param {Record<string, SvelteDecorator>} decorators */
	const render = (decorators) => {
		for (const key of mounted.keys()) {
			if (!decorators[key]) {
				remove(key);
			}
		}

		for (const [key, decorator] of Object.entries(decorators)) {
			const element = editor.getElementByKey(key);
			const entry = mounted.get(key);

			if (entry?.element === element) {
				if (entry.decorator !== decorator) {
					entry.decorator = decorator;
					decorator.updateProps(entry.props);
				}
				continue;
			}

			// The node's DOM was recreated (or is gone), so the old component is in a detached element.
			remove(key);

			if (!element) {
				continue;
			}

			const props = $state({});
			decorator.updateProps(props);
			const instance = mount(decorator.componentClass, { target: element, props, context });
			mounted.set(key, { decorator, element, props, instance });
		}
	};

	render(editor.getDecorators());

	const unregister = editor.registerDecoratorListener(render);

	return () => {
		unregister();
		for (const key of [...mounted.keys()]) {
			remove(key);
		}
	};
};

export const SvelteDecoratorsExtension = defineExtension({
	name: 'article/svelte-decorators',
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	config: /** @type {{ context: Map<any, any> }} */ ({ context: new Map() }),
	register: (editor, { context }) => registerSvelteDecorators(editor, context),
});
