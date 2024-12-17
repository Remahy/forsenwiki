const tailwindcssNesting = require('tailwindcss/nesting');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

const config = {
	plugins: [
		//Some plugins, like tailwindcss/nesting, need to run before Tailwind,
		tailwindcssNesting(),
		tailwindcss(),
		//But others, like autoprefixer, need to run after,
		autoprefixer,
	],
};

module.exports = config;
