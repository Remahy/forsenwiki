/**
 * @param {HTMLElement} element
 * @param {*} changeType 
 */
export const applyCSSColorDiff = (element, changeType) => {
	switch (changeType) {
		case '~':
			// Modified.
			element.style.outline = '1px rgba(255, 127.5, 0, 0.5) dotted';
			element.classList.add('bg-orange-500 bg-opacity-10');
			break;
		case '+':
			// Added.
			element.style.outline = '1px rgba(0, 255, 0, 0.5) solid';
			element.classList.add('bg-green-500 bg-opacity-10');
			break;
		case '-':
			element.style.outline = '1px rgba(255, 0, 0, 0.5) solid';
			element.classList.add('bg-red-500 bg-opacity-10');
			break;
	}
};
