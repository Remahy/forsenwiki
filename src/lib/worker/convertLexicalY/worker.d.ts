export function convertLegacyUpdate(data: { update: string }): {
	content: string;
	byteLength: number;
	text: string;
	legacyText: string;
};
