import { beforeEach, expect, test } from 'vitest';
import { flushSync } from 'svelte';
import {
	$getNodeByKey as getNodeByKey,
	$getRoot as getRoot,
	DecoratorNode,
	type NodeKey,
} from 'lexical';

import { buildEditorFromExtensions, configExtension } from '@lexical/extension';

import DecoratorFixture from './DecoratorFixture.test.svelte';
import {
	registerSvelteDecorators,
	SvelteDecoratorsExtension,
} from './registerSvelteDecorators.svelte';

const log: string[] = [];

class TestDecoratorNode extends DecoratorNode<{
	componentClass: typeof DecoratorFixture;
	updateProps: (props: Record<string, unknown>) => void;
}> {
	__label: string;

	static getType() {
		return 'test-decorator';
	}

	static clone(node: TestDecoratorNode) {
		return new TestDecoratorNode(node.__label, node.__key);
	}

	static importJSON() {
		return new TestDecoratorNode('');
	}

	constructor(label: string, key?: NodeKey) {
		super(key);
		this.__label = label;
	}

	createDOM() {
		return document.createElement('div');
	}

	updateDOM() {
		return false;
	}

	setLabel(label: string) {
		this.getWritable().__label = label;
	}

	decorate() {
		return {
			componentClass: DecoratorFixture,
			updateProps: (props: Record<string, unknown>) => {
				props.label = this.__label;
				props.onlifecycle = (event: string) => log.push(event);
			},
		};
	}
}

const nodes = { name: 'test', nodes: [TestDecoratorNode] };

const setup = (...extensions: Parameters<typeof buildEditorFromExtensions>) => {
	const editor = buildEditorFromExtensions(nodes, ...extensions);
	const root = document.body.appendChild(document.createElement('div'));
	editor.setRootElement(root);
	return editor;
};

const appendNode = (editor: ReturnType<typeof setup>, label: string) => {
	let key = '';
	editor.update(
		() => {
			const node = new TestDecoratorNode(label);
			getRoot().append(node);
			key = node.getKey();
		},
		{ discrete: true }
	);
	flushSync();
	return key;
};

const updateNode = (editor: ReturnType<typeof setup>, fn: () => void) => {
	editor.update(fn, { discrete: true });
	flushSync();
};

beforeEach(() => {
	log.length = 0;
	document.body.innerHTML = '';
});

test('mounts the component into the node element', () => {
	const editor = setup();
	registerSvelteDecorators(editor, new Map());

	const key = appendNode(editor, 'first');

	expect(editor.getElementByKey(key)?.textContent).toBe('first');
	expect(log).toEqual(['mount']);
});

test('mounts decorators that exist before registering', () => {
	const editor = setup();
	const key = appendNode(editor, 'first');

	registerSvelteDecorators(editor, new Map());
	flushSync();

	expect(editor.getElementByKey(key)?.textContent).toBe('first');
	expect(log).toEqual(['mount']);
});

test('updates props without remounting', () => {
	const editor = setup();
	registerSvelteDecorators(editor, new Map());
	const key = appendNode(editor, 'first');

	updateNode(editor, () => (getNodeByKey(key) as TestDecoratorNode | null)?.setLabel('second'));

	expect(editor.getElementByKey(key)?.textContent).toBe('second');
	expect(log).toEqual(['mount']);
});

test('unmounts when the node is removed', () => {
	const editor = setup();
	registerSvelteDecorators(editor, new Map());
	const key = appendNode(editor, 'first');

	updateNode(editor, () => getNodeByKey(key)?.remove());

	expect(log).toEqual(['mount', 'destroy']);
});

test('remounts when the node element is recreated', () => {
	const editor = setup();
	registerSvelteDecorators(editor, new Map());
	const key = appendNode(editor, 'first');
	const oldElement = editor.getElementByKey(key);

	editor.setRootElement(document.body.appendChild(document.createElement('div')));
	flushSync();

	const newElement = editor.getElementByKey(key);
	expect(newElement).not.toBe(oldElement);
	expect(newElement?.textContent).toBe('first');
	expect(log).toEqual(['mount', 'destroy', 'mount']);
});

test('passes the context to the component', () => {
	const editor = setup();
	registerSvelteDecorators(editor, new Map([['suffix', '!']]));

	const key = appendNode(editor, 'first');

	expect(editor.getElementByKey(key)?.textContent).toBe('first!');
});

test('unmounts everything when unregistered', () => {
	const editor = setup();
	const unregister = registerSvelteDecorators(editor, new Map());
	appendNode(editor, 'first');
	appendNode(editor, 'second');

	unregister();
	flushSync();

	expect(log).toEqual(['mount', 'mount', 'destroy', 'destroy']);
});

test('the extension passes its configured context and unmounts on dispose', () => {
	const editor = setup(
		configExtension(SvelteDecoratorsExtension, { context: new Map([['suffix', '!']]) })
	);
	const key = appendNode(editor, 'first');

	expect(editor.getElementByKey(key)?.textContent).toBe('first!');

	editor.dispose();
	flushSync();

	expect(log).toEqual(['mount', 'destroy']);
});
