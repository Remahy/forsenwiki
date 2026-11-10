export function toHTMLWorker(data: {
	config: string;
	content?: string;
	update?: string;
	format?: 'YJS13' | 'LEXICAL_Y';
}): Promise<{ html: string; text: string; image?: string }>;
