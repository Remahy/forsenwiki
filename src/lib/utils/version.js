import v from '/version?raw';
export const version = v.trim().replace(/[\n]+/g, '-').replace(/ /g, '-');
