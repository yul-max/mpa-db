import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
// import FormPlugin from '@/form/plugin';
import PrimeVue from 'primevue/config';
import Lara from "@primevue/themes/lara";
import "primeicons/primeicons.css";
import './styles/main.css';


const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Lara,
    options: {
      darkModeSelector: '.dark', // ← disables dark mode entirely
    },
  }
});
// app.use(FormPlugin, {});
app.mount('#app');
