type Author = { by?: string; at?: number };

export function toHTMLWorker(data: {
	config: string;
	content?: string;
	update?: string;
	format?: 'YJS13' | 'LEXICAL_Y';
}): Promise<{ html: string; text: string; image?: string }>;

export function readVersion(data: { update: string; html?: boolean }): Promise<{
	json: string;
	blocks: Array<[id: string | null, hash: string]>;
	article: { html: string; text: string; image?: string } | null;
}>;

export function renderDiff(data: {
	older: string;
	newer: string;
	view: 'split' | 'combined';
	timeout?: number;
	deadline: number;
	author?: Author;
	blocks?: Record<string, Author>;
	removed?: Record<string, Author>;
}): Promise<{
	changes: Array<{ columns: string[]; start?: { older: number; newer: number } }>;
	partial: boolean;
	omitted: number;
}>;
