import { writeFileSync } from 'node:fs';

import { getLicenseFileText } from 'generate-license-file';

const outputLocation = new URL('static/THIRD-PARTY-LICENSES.txt', import.meta.url);

(async () => {
	const licenseFileText = await getLicenseFileText('./package.json', {
		replace: {
			dreamopt: 'https://raw.githubusercontent.com/andreyvit/dreamopt.js/refs/heads/master/LICENSE',
			'utf8-byte-length': './node_modules/utf8-byte-length/LICENSE.MIT.txt',
		},
	});

	writeFileSync(outputLocation, licenseFileText);
})();
