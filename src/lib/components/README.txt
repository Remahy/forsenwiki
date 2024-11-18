Do not import svelte-lexical into any plugins that are used in the workers.

E.g.
```js
// BAD
import { sanitizeUrl } from 'svelte-lexical';

// GOOD
import { sanitizeUrl } from '$lib/components/editor/utils/sanitizeUrl';
```
