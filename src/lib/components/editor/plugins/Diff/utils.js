/**
 * @param {HTMLElement} element
 * @param {import("./Types").JSONDiffType} changeType
 */
export const applyCSSColorDiff = (element, changeType) => {
	switch (changeType) {
		case '~':
			// Modified.
			element.style.outline = '1px rgba(255, 127.5, 0, 0.5) dotted';
			element.classList.add('bg-orange-500', 'bg-opacity-10');
			break;
		case '+':
			// Added.
			element.style.outline = '1px rgba(0, 255, 0, 0.5) solid';
			element.classList.add('bg-green-500', 'bg-opacity-10');
			break;
		case '-':
			element.style.outline = '1px rgba(255, 0, 0, 0.5) solid';
			element.classList.add('bg-red-500', 'bg-opacity-10');
			break;
	}
};

/**
 *
 * @param {string} key
 * @param {import("./Types").___ChangeObject} change
 */
function getChangeText(key, change) {
	if (typeof change !== 'object') {
		return `  "${key}": ${JSON.stringify(change)}`;
	}

	if (
		Object.prototype.hasOwnProperty.call(change, '__old') &&
		Object.prototype.hasOwnProperty.call(change, '__new')
	) {
		return `~ "${key}" changed from ${JSON.stringify(change.__old)} to ${JSON.stringify(change.__new)}.`;
	}

	if (
		Object.prototype.hasOwnProperty.call(change, '__old') &&
		!Object.prototype.hasOwnProperty.call(change, '__new')
	) {
		return `- "${key}" removed, and its value ${JSON.stringify(change.__old)}.`;
	}

	if (
		!Object.prototype.hasOwnProperty.call(change, '__old') &&
		Object.prototype.hasOwnProperty.call(change, '__new')
	) {
		return `+ "${key}" added with the value ${JSON.stringify(change.__new)}.`;
	}
}

/**
 * @param {HTMLElement} element
 * @param {import("./Types").___Change} ___change
 */
export const addInformationHover = (element, ___change) => {
	const entries = Object.entries(___change).filter(([key]) => key !== '___type');

	if (!entries.length) {
		return;
	}

	element.classList.add('relative');

	const informationIconHover = document.createElement('span');
	informationIconHover.classList.add(
		'bg-blue-500',
		'bg-opacity-50',
		'rounded-full',
		'absolute',
		'top-0',
		'right-0',
		'px-2',
		'text-base',
		'border'
	);

	informationIconHover.textContent = '?';

	informationIconHover.title = entries
		.filter(([, value]) => typeof value === 'object')
		.map(([key, value]) => getChangeText(key, /**@type {any} */ (value)))
		.join('\r\n');

	element.appendChild(informationIconHover);
};
