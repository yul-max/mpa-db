import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
// import FormPlugin from '@/form/plugin';
import PrimeVue from 'primevue/config';
import Lara from "@primevue/themes/lara";
import "primeicons/primeicons.css";
import 'leaflet/dist/leaflet.css';
import './styles/main.css';

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faBookOpen, faUsers, faPlus, faHouse, faSignOutAlt, faChevronRight, faColumns, faLock, faLockOpen, faCheck, faX, faFileZipper, faChevronDown, faChevronUp, faDownload, faArrowLeft, faEdit, faPenToSquare, faUpload, faSort, faSortUp, faSortDown, faFilter, faLocationArrow, faTimes, faMapMarkedAlt, faClockRotateLeft, faCircleInfo, faChartLine } from '@fortawesome/free-solid-svg-icons';

library.add(
  faBookOpen,
  faUsers,
  faPlus,
  faHouse,
  faSignOutAlt,
  faChevronRight,
  faColumns,
  faLock,
  faLockOpen,
  faCheck,
  faX,
  faFileZipper,
  faChevronDown,
  faChevronUp,
  faDownload,
  faArrowLeft,
  faEdit,
  faPenToSquare,
  faUpload,
  faSort,
  faSortUp,
  faSortDown,
  faFilter,
  faLocationArrow,
  faTimes,
  faMapMarkedAlt,
  faClockRotateLeft,
  faCircleInfo,
  faChartLine
);


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
app.component('FontAwesomeIcon', FontAwesomeIcon);
// app.use(FormPlugin, {});
app.mount('#app');
