export function toHTMLWorker(data: {
	config: string;
	content?: string;
	update?: string;
}): Promise<{ html: string; text: string; image?: string }>;
