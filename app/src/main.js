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

axios.interceptors.request.use(
  config => {
    config.headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);
axios.interceptors.response.use(
    response => {
        const info = response.headers.get('Authentication-Info');
        if (info) {
            let token = ""
            for (let part of info.split(',')) {
                part = part.trim();
                let eq = part.search('=');
                if (eq < 0) continue;
                let e = eq;
                while (e > 0 && (part[e - 1] == ' ' || part[e - 1] == '\t')) --e;
                if (e != 13 || part.substring(0, 13).toLowerCase() != 'bearer-update') continue;
                 part.substring(eq + 1).trim();
                token = part.substring(eq + 1).trim();
                localStorage.setItem('token', token);
                break;
            }
        }
        
      return response;
    }
  );

app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app')

