## [1.0.0-beta.16](https://github.com/Remahy/forsenwiki/compare/v1.0.0-beta.13...v1.0.0-beta.16) (2025-12-09)

### ⚠ BREAKING CHANGES

* Svelte 5 migration (#108)

### Features

* Add description, first image and authors to head meta ([#122](https://github.com/Remahy/forsenwiki/issues/122)) ([906006e](https://github.com/Remahy/forsenwiki/commit/906006e275a66bc8fd1cc77abf2f6ce75d1c9f90))
* Move goatcounter to container, add Popular articles box ([#136](https://github.com/Remahy/forsenwiki/issues/136)) ([1389214](https://github.com/Remahy/forsenwiki/commit/1389214a326f58ad5fb09b522d45dd2c84e82334))

### Bug Fixes

* Add classes to italic & bold for editor ([#114](https://github.com/Remahy/forsenwiki/issues/114)) ([43bcbf9](https://github.com/Remahy/forsenwiki/commit/43bcbf92ca58791d230bd9b5459a17b83c973962))
* Add new WSRV ip & redirect www subdomain to non-www ([#134](https://github.com/Remahy/forsenwiki/issues/134)) ([1d45250](https://github.com/Remahy/forsenwiki/commit/1d45250d3b9120d8f61f218218296122291806d2))
* Add scrollbar to overflowing tables ([#129](https://github.com/Remahy/forsenwiki/issues/129)) ([bfac3e9](https://github.com/Remahy/forsenwiki/commit/bfac3e91a67f0e7627293410bb2da970d9e5aed4))
* **Auth:** Update user name on signIn ([#115](https://github.com/Remahy/forsenwiki/issues/115)) ([ed4d0f3](https://github.com/Remahy/forsenwiki/commit/ed4d0f3aa7a485d88d2de2cd94479a6a78f0230b))
* Bug fix articleConfig & remove non-implemented diff node import ([#112](https://github.com/Remahy/forsenwiki/issues/112)) ([cac3b9b](https://github.com/Remahy/forsenwiki/commit/cac3b9b03214d9208ccaeb35086df839cb6ec243))
* **FloatBlock:** Arrow left & right to insert paragraph ([#133](https://github.com/Remahy/forsenwiki/issues/133)) ([b7fff4c](https://github.com/Remahy/forsenwiki/commit/b7fff4c42cefb92e6b0bd9766758dce7ad20dd36))
* Image vertical align, video alignment fix in editor, make all buttons cursor-pointer ([#127](https://github.com/Remahy/forsenwiki/issues/127)) ([e138f53](https://github.com/Remahy/forsenwiki/commit/e138f53f39255aa184dfb486798723eaafcd1767))
* Insert link url when selection is collapsed ([#130](https://github.com/Remahy/forsenwiki/issues/130)) ([5869ecb](https://github.com/Remahy/forsenwiki/commit/5869ecbef18c2915c51e4401e827b3319a3500dc))
* Make FloatBlock values conditional & various dev fixes ([#111](https://github.com/Remahy/forsenwiki/issues/111)) ([dcb3853](https://github.com/Remahy/forsenwiki/commit/dcb385342e55e63ad5c3df50ccd982fe7a4bb116))
* Make sure FloatButton props are exported, use Lexical htmlExport for overrides ([#126](https://github.com/Remahy/forsenwiki/issues/126)) ([8dfb8dd](https://github.com/Remahy/forsenwiki/commit/8dfb8dd2c1bb0ac1aa978f7c544b7c51f53e48c8))
* Migrate nodes to new lexical version ([#113](https://github.com/Remahy/forsenwiki/issues/113)) ([98ba1e5](https://github.com/Remahy/forsenwiki/commit/98ba1e59995b9e3990ae234936513d826faffcc7))
* remove json.stringify from error output for user ([f6096f7](https://github.com/Remahy/forsenwiki/commit/f6096f761b853eff72d534713c1d44e53129d8b6))
* Replace OpenDyslexic with Comic Neue ([#121](https://github.com/Remahy/forsenwiki/issues/121)) ([fee9de5](https://github.com/Remahy/forsenwiki/commit/fee9de5e8a5afd7cd242b7a3e60a0e528718cd06))
* Responsive video sizing, resizer fixes ([#118](https://github.com/Remahy/forsenwiki/issues/118)) ([079221c](https://github.com/Remahy/forsenwiki/commit/079221c60cd8bd79769e34dceb8c843d950258e5))
* Search button style ([#131](https://github.com/Remahy/forsenwiki/issues/131)) ([dc3e9fb](https://github.com/Remahy/forsenwiki/commit/dc3e9fbb5ae68b47510bcd1d1bf65c2a21fcf3c8))
* Toolbar values updating, VideoEmbedNode selection fixes ([#120](https://github.com/Remahy/forsenwiki/issues/120)) ([02a19e6](https://github.com/Remahy/forsenwiki/commit/02a19e6b51686104904dfb318e2a4ed65044c978))
* Update user profile image on user login ([#117](https://github.com/Remahy/forsenwiki/issues/117)) ([b575b0c](https://github.com/Remahy/forsenwiki/commit/b575b0ced6dd54ebc27d7d31e729d9c5a80e964e))
* Use correct property for diff & html ([#124](https://github.com/Remahy/forsenwiki/issues/124)) ([0675d81](https://github.com/Remahy/forsenwiki/commit/0675d8141b55593c15fa49b165c3b11257e5ec60))
* Use correct Y.js import for initialUpdate worker ([#110](https://github.com/Remahy/forsenwiki/issues/110)) ([0c33280](https://github.com/Remahy/forsenwiki/commit/0c332805ee58f9f56a0d61f3f4d3cf9376e33df7))
* Use http:// for development environment ([#135](https://github.com/Remahy/forsenwiki/issues/135)) ([8295eae](https://github.com/Remahy/forsenwiki/commit/8295eaef0979493ad416508494abfcc09efcd01b))
* Use toUTCString() on date hovers ([#125](https://github.com/Remahy/forsenwiki/issues/125)) ([0eeaf38](https://github.com/Remahy/forsenwiki/commit/0eeaf38df753567aae89c0b2ddeb028851314832))
* Various regression fixes ([#128](https://github.com/Remahy/forsenwiki/issues/128)) ([b79fc0f](https://github.com/Remahy/forsenwiki/commit/b79fc0f220153df290b5ed48efc6729b48f31d21))

### Code Refactoring

* Svelte 5 migration ([#108](https://github.com/Remahy/forsenwiki/issues/108)) ([58b3ab5](https://github.com/Remahy/forsenwiki/commit/58b3ab52864a7c95b277f04db7433ff369f42248))
## 1.0.0-beta.13 (2025-01-06)

### Bug Fixes

* Add CSS rule to make image inline-block ([d137116](https://github.com/Remahy/forsenwiki/commit/d1371162d1a3cb1344c4d981b791e9c9bb44622c))
## [1.0.0-beta.12](https://github.com/Remahy/forsenwiki/compare/v1.0.0-beta.11...v1.0.0-beta.12) (2025-01-06)

### Features

* Changelogs ([dd3f738](https://github.com/Remahy/forsenwiki/commit/dd3f7386651baaa6fc5a01bc6d821d6051ecb834))
## 1.0.0-beta.11 (2025-01-06) and prior

### Features

* /browse -ing around endpoint ([#27](https://github.com/Remahy/forsenwiki/issues/27)) ([fd03f14](https://github.com/Remahy/forsenwiki/commit/fd03f14c6fbea2f10cbf2169452a0f51e93a93c4))
* Add programmatic version printing ([8c584fd](https://github.com/Remahy/forsenwiki/commit/8c584fd0530df799c14464150b106053ed012008))
* Add simple UI style ([7f82bcd](https://github.com/Remahy/forsenwiki/commit/7f82bcdfdf771ed145f1e14364ba6dd6e1d93b61))
* Content management ([#30](https://github.com/Remahy/forsenwiki/issues/30)) ([5c8b573](https://github.com/Remahy/forsenwiki/commit/5c8b573736718aa3003cd30c28bdc3d62a8f0dd3))
* FallbackNode & More QoL ([#38](https://github.com/Remahy/forsenwiki/issues/38)) ([3748c0d](https://github.com/Remahy/forsenwiki/commit/3748c0d8753c32c9f73429cc84e0f9d27459c926))
* Float Block ([#93](https://github.com/Remahy/forsenwiki/issues/93)) ([4b2f4be](https://github.com/Remahy/forsenwiki/commit/4b2f4be1d985c6817c06c902b49ead246a39648f))
* Frontpage SSE ([#10](https://github.com/Remahy/forsenwiki/issues/10)) ([7154990](https://github.com/Remahy/forsenwiki/commit/7154990bb7bbe2b78a3776926573dc9a0d26088b))
* History diff viewer ([#44](https://github.com/Remahy/forsenwiki/issues/44)) ([7fe389c](https://github.com/Remahy/forsenwiki/commit/7fe389c0772499f9a1e74659af3b47652f2c0a7d))
* HTML cache bust & QoL improvements ([#99](https://github.com/Remahy/forsenwiki/issues/99)) ([5dec771](https://github.com/Remahy/forsenwiki/commit/5dec7716d8e34253527bc7142f0aacff90f4ec5a))
* Improve article page & rudimentary ToC & dev fixes ([#77](https://github.com/Remahy/forsenwiki/issues/77)) ([fde63c8](https://github.com/Remahy/forsenwiki/commit/fde63c8f0afec37e3ed0a4bfc41f2bd2a30ebcc5))
* Post creation & Twitch login  ([#1](https://github.com/Remahy/forsenwiki/issues/1)) ([33cd98d](https://github.com/Remahy/forsenwiki/commit/33cd98d027b6e2802190050acf3f3c4b8858e0e7))
* Post read ([#4](https://github.com/Remahy/forsenwiki/issues/4)) ([3f692c4](https://github.com/Remahy/forsenwiki/commit/3f692c41bb928d3fe1c2da6c3f05ca67ba22c166))
* Post update ([#9](https://github.com/Remahy/forsenwiki/issues/9)) ([b646a04](https://github.com/Remahy/forsenwiki/commit/b646a04b7cd5221f6465d1593a7906455d7819e4))
* Random endpoint ([#76](https://github.com/Remahy/forsenwiki/issues/76)) ([1b8ebfd](https://github.com/Remahy/forsenwiki/commit/1b8ebfdf48209733321d07b75c6816cb9d09da54))
* Recent updates takes you to the historical version & diff editor fix ([#79](https://github.com/Remahy/forsenwiki/issues/79)) ([bba42a0](https://github.com/Remahy/forsenwiki/commit/bba42a0129f119d924c0c359d1741d0186c0fbc6))
* Reset draft cache button ([#57](https://github.com/Remahy/forsenwiki/issues/57)) ([90a8653](https://github.com/Remahy/forsenwiki/commit/90a8653f35b993cdc4d6411a46bf71b4a922f6ff))
* Rudimentary table diff ([#89](https://github.com/Remahy/forsenwiki/issues/89)) ([373ca8f](https://github.com/Remahy/forsenwiki/commit/373ca8f90ac2bf96a15f309071572ebfb81a05da))
* Search endpoint ([#20](https://github.com/Remahy/forsenwiki/issues/20)) ([7c0a3c4](https://github.com/Remahy/forsenwiki/commit/7c0a3c49859836969c3c5c1d1eb1554a2059e1a7))
* Setup prisma & authjs ([4ccf76d](https://github.com/Remahy/forsenwiki/commit/4ccf76dc5bced7efe070cf95be5f28c3b8706ba2))
* Show article authors & send less data on requests & img fixes ([#26](https://github.com/Remahy/forsenwiki/issues/26)) ([40a1d3c](https://github.com/Remahy/forsenwiki/commit/40a1d3c03f94ffe384a1572761a6731b2d3fc27b))
* Static content (images) ([#11](https://github.com/Remahy/forsenwiki/issues/11)) ([0ef5a87](https://github.com/Remahy/forsenwiki/commit/0ef5a87aca4bd47a9c5b7bc1cd0569d227dfd01e))
* Style changes & forsen-wiki-theme classnames ([#71](https://github.com/Remahy/forsenwiki/issues/71)) ([b614397](https://github.com/Remahy/forsenwiki/commit/b6143979b5c93704d1f0de0edf0e2f77dca309fb))
* Support YouTube clips & Handle new twitch clip url ([#74](https://github.com/Remahy/forsenwiki/issues/74)) ([43b26f7](https://github.com/Remahy/forsenwiki/commit/43b26f79ad5f098a5b61791a46e8923e41234da2))
* Tables ([#83](https://github.com/Remahy/forsenwiki/issues/83)) ([16bd5e8](https://github.com/Remahy/forsenwiki/commit/16bd5e8b3b960f329acc136b01dc15e759626da0))
* YouTube & Twitch embeds ([#35](https://github.com/Remahy/forsenwiki/issues/35)) ([9e7db7b](https://github.com/Remahy/forsenwiki/commit/9e7db7b4366bd23ff6eeb2f6df7148d6e987df6e))

### Bug Fixes

* Add ?random param to the `/random` endpoint results ([66c2d9d](https://github.com/Remahy/forsenwiki/commit/66c2d9d7e92eddd8a91d8a48c4fb94605defd060))
* Add checks to prevent overeager deletion of ImageComponent ([#80](https://github.com/Remahy/forsenwiki/issues/80)) ([c31fdc3](https://github.com/Remahy/forsenwiki/commit/c31fdc34b46f88d2972ac881dfd8e6ca9663c237))
* Add initial content on new articles & fix AutoFocus ([#53](https://github.com/Remahy/forsenwiki/issues/53)) ([2e4222f](https://github.com/Remahy/forsenwiki/commit/2e4222f30613954c75d6c15553fcec4d9162bad8))
* Cloudflare & lexical html output cache & Various UI fixes ([#31](https://github.com/Remahy/forsenwiki/issues/31)) ([6bfd89b](https://github.com/Remahy/forsenwiki/commit/6bfd89b431d52c6edf01108b49d361e1dcd2a9ce))
* Don't use Lexical's node.key for heading ids ([#78](https://github.com/Remahy/forsenwiki/issues/78)) ([28bb788](https://github.com/Remahy/forsenwiki/commit/28bb78878513cdb4fd8c6ed5894b86ff6c720837))
* Import image CSS in the history endpoints ([#51](https://github.com/Remahy/forsenwiki/issues/51)) ([df9b250](https://github.com/Remahy/forsenwiki/commit/df9b250406803ee878ca595eca0c5f2f61d700bc))
* Improve ImageNode & VideoEmbedNode ([#98](https://github.com/Remahy/forsenwiki/issues/98)) ([053bb43](https://github.com/Remahy/forsenwiki/commit/053bb4354a854bd96a97d810adf0a70767ca4389))
* Linting & catch error fixes for article create/update ([#43](https://github.com/Remahy/forsenwiki/issues/43)) ([7f0f818](https://github.com/Remahy/forsenwiki/commit/7f0f818f27908d54391306c07c777a0d6237fa8f))
* Make overriden linkAccount return AdapterAccount ([#5](https://github.com/Remahy/forsenwiki/issues/5)) ([bdaace7](https://github.com/Remahy/forsenwiki/commit/bdaace77bda1c0cf32eda1ecb55ed77b8dfac8dd))
* Make random button conditional on whether `random` is in the url searchParams ([43093ab](https://github.com/Remahy/forsenwiki/commit/43093ab40affec0c1e54b87eaaa00037621086a4))
* Minor accessibility fixes & navbar UI improvements ([#21](https://github.com/Remahy/forsenwiki/issues/21)) ([d3f6708](https://github.com/Remahy/forsenwiki/commit/d3f6708eefad2aeaeb4c086335b1553c0eee7293))
* More than 1, not more than 2 ([9aaba53](https://github.com/Remahy/forsenwiki/commit/9aaba53c0517002fcd780307c7df9494aedf9da3))
* Prevent crash with missing diff-linebreak & diff-tab ([#75](https://github.com/Remahy/forsenwiki/issues/75)) ([4cfdeec](https://github.com/Remahy/forsenwiki/commit/4cfdeec2d4855263c1888de9ccc5744cd64ea734))
* Prevent various crashes ([#88](https://github.com/Remahy/forsenwiki/issues/88)) ([7e3efc1](https://github.com/Remahy/forsenwiki/commit/7e3efc178e3d952643a1ad24fe8dc69ecca9abcc))
* Put linkedom behind a worker_thread to prevent prismjs timeout ([#50](https://github.com/Remahy/forsenwiki/issues/50)) ([e09472a](https://github.com/Remahy/forsenwiki/commit/e09472ae4a5dff5109195ceed85febe91d77cce8))
* Reduce crashes when loading in a diff for old updates with heading and link ([#86](https://github.com/Remahy/forsenwiki/issues/86)) ([5b4602f](https://github.com/Remahy/forsenwiki/commit/5b4602fce82ffcd4499d8a7f3d08034951edff74))
* Remove boilerplate code & Add placeholders ([b773b13](https://github.com/Remahy/forsenwiki/commit/b773b13c9b719a747e300970c22d2bfb98a73455))
* Remove parentheses around the at signs ([#73](https://github.com/Remahy/forsenwiki/issues/73)) ([22a4822](https://github.com/Remahy/forsenwiki/commit/22a4822f794994c1e91ef8f87c6ec73a8afd105d))
* **Styling:** New colors, dividers, flex layout ([#3](https://github.com/Remahy/forsenwiki/issues/3)) ([6b07125](https://github.com/Remahy/forsenwiki/commit/6b07125a351e2c5125d0d5108fd1ced8d75758c2))
* Use cache url for checking when to turn img into b64 ([#24](https://github.com/Remahy/forsenwiki/issues/24)) ([f74540f](https://github.com/Remahy/forsenwiki/commit/f74540f455bdd079d08cce6d3cdbcdb7671b1a83))
* Use esbuild to create worker files & don't import Prism into worker ([#59](https://github.com/Remahy/forsenwiki/issues/59)) ([736b33e](https://github.com/Remahy/forsenwiki/commit/736b33e2bed677789c11075e5af18645d9c0305f))
* Various VideoEmbedNode & ImageNode improvements ([#85](https://github.com/Remahy/forsenwiki/issues/85)) ([66553cb](https://github.com/Remahy/forsenwiki/commit/66553cb3c3a652fe1d853f54cae6bbaa2e0b05fc))
* **VideoEmbed:** Bug fixes & QoL ([#37](https://github.com/Remahy/forsenwiki/issues/37)) ([e3a1c0d](https://github.com/Remahy/forsenwiki/commit/e3a1c0dd30106bceb2454dd5ed2ca597a974bf6b))
* Whitespace changes & VideoEmbedNode responsiveness ([#42](https://github.com/Remahy/forsenwiki/issues/42)) ([4a5b1a5](https://github.com/Remahy/forsenwiki/commit/4a5b1a55bef171c8e7a3188ea8117a54ecea932a))