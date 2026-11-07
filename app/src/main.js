import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/js/bootstrap.js'
import './registerServiceWorker'

/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

/* import specific icons */
import { faFlag } from '@fortawesome/free-solid-svg-icons'
import { faFlag as faFlagRegular } from '@fortawesome/free-regular-svg-icons'

/* add icons to the library */
library.add(faFlag, faFlagRegular)

const app = createApp(App)

app.use(router)

axios.defaults.timeout = 15000;
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
axios.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && !/\/auth\/(login|register)$/.test(error.config?.url || '')) {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    router.replace({ name: 'login', query: { expired: '1' } });
  }
  return Promise.reject(error);
});

app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app')

