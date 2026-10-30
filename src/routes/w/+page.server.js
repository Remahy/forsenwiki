import { readAllArticleTitles } from '$lib/db/post/read';

/**
 * @typedef {{ title: string, rawTitle: string }} IndexArticle
 * @typedef {{ letter: string, articles: IndexArticle[] }} IndexGroup
 */

const OTHER = '#';

/** @param {string} name */
const getLetter = (name) => {
	const first = name.trim().charAt(0).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

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

	for (const article of articles) {
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
		.sort(([a], [b]) => (a === OTHER ? -1 : b === OTHER ? 1 : a.localeCompare(b)))
		.map(([letter, articles]) => ({ letter, articles }));

	return { groups, total: articles.length };
}
