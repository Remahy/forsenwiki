import { IS_APPLE } from './utils';

// Shortcut labels follow each platform, e.g. ⌘⇧Z on Apple and Ctrl+Shift+Z elsewhere.
export const ctrlKey = IS_APPLE ? '⌘' : 'Ctrl+';
export const shiftKey = IS_APPLE ? '⇧' : 'Shift+';

export const STATIC_DOMAIN = import.meta.env.VITE_STATIC_DOMAIN;
export const DOMAIN = import.meta.env.VITE_DOMAIN;
