Do not import svelte-lexical into any plugins that are used in the workers.

E.g.
```js
// BAD
import { sanitizeUrl } from 'svelte-lexical';

// GOOD
import { sanitizeUrl } from '$lib/components/editor/utils/sanitizeUrl';
```

Do not use lang="ts" in any Svelte files that are used in the workers.
