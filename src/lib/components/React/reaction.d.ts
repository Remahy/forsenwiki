export type Note = {
	anchor: number;
	reactionKey: string;
	index: number;
	authors: Array<{ id: string; name: string; rangeId: string }>;
} & { Component: any; props: any };

export type DisplayReaction = Note & {
	getStyle: (index: number) => string;
	className: string;
	y: number;
};
