import { IS_APPLE } from "./utils";

export const ctrlKey = IS_APPLE ? '⌘' : 'CTRL+';

export const DOMAIN = import.meta.env.VITE_DOMAIN;
