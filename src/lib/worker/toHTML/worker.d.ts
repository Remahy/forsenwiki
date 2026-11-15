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

type DiffRow = import('$lib/lexical/diff/helpers').DiffRow;

export function compareVersions(data: {
	older: string;
	newer: string;
	view: 'split' | 'combined';
	timeout?: number;
	author?: Author;
	blocks?: Record<string, Author>;
	removed?: Record<string, Author>;
}): Promise<{ rows: DiffRow[]; partial: boolean }>;

export function renderRows(data: {
	rows: DiffRow[];
}): Promise<Array<{ columns: string[]; start?: { older: number; newer: number } }>>;
