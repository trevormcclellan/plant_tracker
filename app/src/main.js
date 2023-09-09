import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/js/bootstrap.js'
import './registerServiceWorker'

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

app.mount('#app')

