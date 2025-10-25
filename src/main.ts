import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import VeeValidate from 'vee-validate';
import PrimeVue from 'primevue/config';

const app = createApp(App)

app.use(createPinia())
app.use(VeeValidate)
app.use(PrimeVue)

app.mount('#app')
