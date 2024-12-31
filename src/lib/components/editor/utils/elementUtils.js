/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * @typedef {import("lexical").ElementFormatType} ElementFormatType
 */

// Element node formatting
const IS_ALIGN_AUTO = 0;
const IS_ALIGN_LEFT = 1;
const IS_ALIGN_CENTER = 2;
const IS_ALIGN_RIGHT = 3;
const IS_ALIGN_JUSTIFY = 4;
const IS_ALIGN_START = 5;
const IS_ALIGN_END = 6;

export const ELEMENT_FORMAT_TO_TYPE = {
  [IS_ALIGN_AUTO]: '',
  [IS_ALIGN_CENTER]: 'center',
  [IS_ALIGN_END]: 'end',
  [IS_ALIGN_JUSTIFY]: 'justify',
  [IS_ALIGN_LEFT]: 'left',
  [IS_ALIGN_RIGHT]: 'right',
  [IS_ALIGN_START]: 'start'
};

const ELEMENT_TYPE_TO_FORMAT = {
  '': IS_ALIGN_AUTO,
  center: IS_ALIGN_CENTER,
  end: IS_ALIGN_END,
  justify: IS_ALIGN_JUSTIFY,
  left: IS_ALIGN_LEFT,
  right: IS_ALIGN_RIGHT,
  start: IS_ALIGN_START
};

/**
 * @param {ElementFormatType} type
 */
export const getFormat = (type) => {
	return type !== '' ? /** @type {keyof typeof ELEMENT_FORMAT_TO_TYPE} */ (ELEMENT_TYPE_TO_FORMAT[type]) : 0;
};


/**
 * @param {keyof ELEMENT_FORMAT_TO_TYPE} format
 */
export const getFormatType = (format) => {
	return /** @type {ElementFormatType} */ (ELEMENT_FORMAT_TO_TYPE[format]) || '';
};
