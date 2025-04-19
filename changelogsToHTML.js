import { readFileSync, writeFileSync } from 'node:fs';

import { marked } from 'marked';
import { gfmHeadingId } from "marked-gfm-heading-id";

marked.use(gfmHeadingId());

const changelogFile = readFileSync('./CHANGELOG.md', 'utf-8');

const outputLocation = new URL('src/routes/changelogs/changelogs.html', import.meta.url);

const html = marked.parse(changelogFile, { async: false });

writeFileSync(outputLocation, html);
