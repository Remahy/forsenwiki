export type Note = {
	anchor: number;
	focus: number;
	reactionKey: string;
	index: number;
	authors: Array<{ id: string; name: string; rangeId: string }>;
} & { Component: any; props: any };

export type DisplayReaction = Note & {
	getStyle: (index: number) => string;
	className: string;
	text: string | null;
	y: number;
};
