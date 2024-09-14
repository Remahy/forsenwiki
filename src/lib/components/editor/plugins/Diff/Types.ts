import type { Change } from 'diff';

export type JSONDiffType = ' ' | '~' | '+' | '-';

export type ___ChangeTextNode = { ___type: JSONDiffType } & Record<
	string,
	___ChangeObject & {
		diff?: Change[];
	}
>;

export type ___Change = { ___type: JSONDiffType } & Record<
	string,
	___ChangeObject
>;

export type ___ChangeObject = 	{
		__old?: any;
		__new?: any;
	}
