let version = '';

if (import.meta.env.PROD && !version) {
	(async () => {
		const v = await import('/version?raw');
		version = v.default.trim().replace(/[\n]+/g, '-').replace(/ /g, '-');
	})();
}

export { version };
