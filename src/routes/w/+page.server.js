import { readAllArticleTitles } from '$lib/db/post/read';

/**
 * @typedef {{ title: string, rawTitle: string }} IndexArticle
 * @typedef {{ letter: string, articles: IndexArticle[] }} IndexGroup
 */

const OTHER = '#';

/** @param {string} name */
const getLetter = (name) => {
	const first = name
		.trim()
		.charAt(0)
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toUpperCase();

	return /[A-Z]/.test(first) ? first : OTHER;
};

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

export async function load() {
	const rawArticles = await readAllArticleTitles();

	/** @type {IndexArticle[]} */
	const articles = rawArticles
		.map(({ title, rawTitle }) => ({ title, rawTitle: rawTitle || title }))
		.sort((a, b) => collator.compare(a.rawTitle, b.rawTitle));

	/** @type {Map<string, IndexArticle[]>} */
	const byLetter = new Map();

	for (let index = 0; index < articles.length; index++) {
		const article = articles[index];

		const letter = getLetter(article.rawTitle);
		const group = byLetter.get(letter);
		if (group) {
			group.push(article);
		} else {
			byLetter.set(letter, [article]);
		}
	}

	/** @type {IndexGroup[]} */
	const groups = [...byLetter.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([letter, articles]) => ({ letter, articles }));

	return { groups, total: articles.length };
}
