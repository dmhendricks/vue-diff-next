import { createApp } from 'vue';
import App from './App.vue';
// Same split a consumer would make: default sheet, then opt-in palettes.
import '../../src/assets/scss/index.scss';
import '../../src/assets/scss/themes/classic-dark.scss';
import '../../src/assets/scss/themes/classic-light.scss';

createApp(App).mount('#app');
