import { DOMAIN } from '$lib/environment/environment';
import { wikiLinkOf } from '$lib/utils/externalLink';
import { hashLink } from '$lib/utils/hashLink.server';

export const WIKI_LINK_HASH = hashLink(wikiLinkOf(DOMAIN));
