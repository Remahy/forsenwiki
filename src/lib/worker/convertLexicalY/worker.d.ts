export function convertLegacyUpdate(data: { update: string }): {
	content: string;
	byteLength: number;
	differences: string[];
};
