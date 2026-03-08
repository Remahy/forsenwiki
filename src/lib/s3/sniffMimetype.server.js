import { fileTypeFromBuffer } from 'file-type';
import { MagikaNode as Magika } from 'magika/node';
import { magikaTypeToMimetype } from './limits';

/**
 * @type {any}
 */
let magika;

async function getMagika() {
	if (!magika) {
		// @ts-ignore
		magika = await Magika().create();
	}

	return magika;
}

/**
 * @param {Uint8Array} fileSnippet first 16KB of file
 */
export const sniffMimetype = async (fileSnippet) => {
	const ft = await fileTypeFromBuffer(fileSnippet);

	if (ft?.mime) {
		return { mimetype: ft.mime, source: 'file-type', metadata: JSON.stringify(ft) };
	}

	const magika = await getMagika();
	/** @type {{ status: 'ok', prediction: { score: number, output: { label: string, is_text: boolean } } }} */
	const detected = await magika.identifyBytes(fileSnippet);

	if (detected.status !== 'ok') {
		return null;
	}

	return {
		mimetype: magikaTypeToMimetype[detected.prediction.output.label],
		source: 'magika',
		metadata: JSON.stringify(detected.prediction),
	};
};
