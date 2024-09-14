import type { Change } from 'diff';

export type JSONDiffType = ' ' | '~' | '+' | '-';

export type ___ChangeTextNode = { ___type: JSONDiffType } & Record<
	string,
	{
		__old: any;
		__new: any;
		diff?: Change[];
	}
>;

export type ___Change = { ___type: JSONDiffType } & Record<
	string,
	{
		__old: any;
		__new: any;
	}
>;
