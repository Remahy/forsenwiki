import { expect, test } from 'vitest';

import { render } from './template';

const escape = (text: string) => text.replace(/\*/g, '\\*');

test('double braces escape, triple braces do not', () => {
	expect(render('{{a}} {{{a}}}', { a: '*x*' }, { escape })).toBe('\\*x\\* *x*');
});

test('a string that is only a placeholder keeps the type of the value', () => {
	expect(
		render({ embeds: '{{{embeds}}}', count: '{{{n}}}' }, { embeds: [{ title: 'a' }], n: 3 })
	).toEqual({
		embeds: [{ title: 'a' }],
		count: 3,
	});
});

test('empty values leave out their field, their line, and what is left empty', () => {
	expect(
		render(
			{
				url: '{{{url}}}',
				description: 'First\n*{{why}}*\nLast {{n}}',
				author: { name: '{{{who}}}' },
			},
			{ url: null, why: '', n: 2 }
		)
	).toEqual({ description: 'First\nLast 2' });
});

test('empty arrays and objects written in the template stay', () => {
	expect(render({ allowed_mentions: { parse: [] }, extra: {} }, {})).toEqual({
		allowed_mentions: { parse: [] },
		extra: {},
	});
});

test('nested paths are looked up, missing ones are empty', () => {
	expect(
		render('{{user.name}}|{{user.nope.deeper}}', { user: { name: 'forsen' } })
	).toBeUndefined();
	expect(render('{{user.name}}', { user: { name: 'forsen' } })).toBe('forsen');
});
