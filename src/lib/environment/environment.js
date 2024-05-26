import { IS_APPLE } from './utils';

export const ctrlKey = IS_APPLE ? '⌘' : 'CTRL+';

export const STATIC_DOMAIN = import.meta.env.VITE_STATIC_DOMAIN;
