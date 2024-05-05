const typography = require('@tailwindcss/typography');
const forms = require('@tailwindcss/forms');

/** @type {import('tailwindcss').Config}*/
const config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			fontFamily: {
				dyslexic: 'OpenDyslexic, \'Comic Sans MS\', arial, helvetica, sans-serif',
			},
		}
	},

	plugins: [forms, typography]
};

module.exports = config;
