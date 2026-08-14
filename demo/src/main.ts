import { createApp } from 'vue';
import App from './App.vue';
// Same split a consumer would make: default sheet, then opt-in palettes.
import '../../src/assets/scss/index.scss';
import '../../src/assets/scss/themes/monokai-dark.scss';
import '../../src/assets/scss/themes/visual-studio-light.scss';
import '../../src/assets/scss/themes/visual-studio-dark.scss';
import '../../src/assets/scss/themes/atom-dark.scss';
import '../../src/assets/scss/themes/atom-light.scss';
import '../../src/assets/scss/themes/github-dark.scss';
import '../../src/assets/scss/themes/github-light.scss';
import '../../src/assets/scss/themes/coral-dark.scss';
import '../../src/assets/scss/themes/coral-light.scss';

createApp(App).mount('#app');
