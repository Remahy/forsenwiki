import { building } from '$app/environment';
import { GOATCOUNTER_API_KEY, GOATCOUNTER_DISABLED } from '$env/static/private';
import { _emit } from '../routes/adonis/frontpage/+server';
import prisma from './prisma';

const GOATCOUNTER_DOMAIN = 'http://goatcounter:8080';

const headers = new Headers({
	'Content-Type': 'application/json',
	Authorization: `Bearer ${GOATCOUNTER_API_KEY}`,
});

// https://www.goatcounter.com/api2.html
const queryStrings = new URLSearchParams({
	limit: '20',
	daily: 'true',
});

/**
 * @typedef {Object} GoatCounterHit
 * @property {string} path
 * @property {string} title
 * @property {number} max
 */

// https://stackoverflow.com/a/14400861
const msToNextHour = () => {
	return 3600000 - (new Date().getTime() % 3600000);
};

/**
 * @param {GoatCounterHit[]} arr
 */
const filterArticlePages = (arr) =>
	arr.filter(({ path }) => path.startsWith('/w/') && path.split('/').length === 3);

/**
 * @param {GoatCounterHit[]} arr
 */
const parseResults = async (arr) => {
	const titles = arr
		.filter(({ title }) => typeof title === 'undefined' || title.length === 0)
		.map(({ path }) => path.split('/').pop())
		.filter((v) => typeof v !== 'undefined');

	const foundTitles = await prisma.yPost.findMany({
		where: { title: { in: titles } },
		select: { title: true, rawTitle: true },
	});

	let newArr = structuredClone(arr);

	for (let index = 0; index < foundTitles.length; index += 1) {
		const { rawTitle, title } = foundTitles[index];
		const path = `/w/${title}`;

		const newArrIndex = newArr.findIndex(({ path: p }) => p === path);

		if (newArrIndex === -1) {
			continue;
		}

		newArr[newArrIndex].title = rawTitle;
	}

	return newArr;
};

/**
 * @param {GoatCounterHit[]} arr
 */
const formattedHits = (arr) => arr.map(({ max, path, title }) => ({ max, path, title }));

/**
 * @throws
 */
export const getPopularArticles = async () => {
	const res = await fetch(`${GOATCOUNTER_DOMAIN}/api/v0/stats/hits?${queryStrings.toString()}`, {
		headers,
	});

	/**
	 * @type {{ hits: GoatCounterHit[] }}
	 */
	const data = await res.json();

	const filteredResults = filterArticlePages(data.hits);

	const parsedResults = await parseResults(filteredResults);

	return formattedHits(parsedResults);
};

const getData = () =>
	setTimeout(async () => {
		const data = await getPopularArticles();
		_emit('articles:popular', data);
		getData();
	}, msToNextHour());

if (GOATCOUNTER_API_KEY && GOATCOUNTER_DOMAIN && !building && GOATCOUNTER_DISABLED) {
	getData();
} else {
	console.warn('Environment value GOATCOUNTER_API_KEY not set. Popular articles disabled.');
}
