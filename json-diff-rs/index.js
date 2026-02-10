import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * @type {{ jsonDiff: (input1: string, input2: string) => string }}
 */
export default require('./index.node');
