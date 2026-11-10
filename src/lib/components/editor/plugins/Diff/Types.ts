import type { Change } from 'diff';

export type JSONDiffType = ' ' | '~' | '+' | '-';

export type ___ChangeObject = {
	__old?: any;
	__new?: any;
};

// Property changes have to be narrowed before use.
type ChangeRecord<T extends ___ChangeObject> = {
	___type: JSONDiffType;
	[key: string]: JSONDiffType | T;
};

export type ___ChangeTextNode = ChangeRecord<
	___ChangeObject & {
		diff?: Change[];
	}
>;

export type ___Change = ChangeRecord<___ChangeObject>;
