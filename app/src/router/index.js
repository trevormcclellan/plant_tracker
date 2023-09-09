import { createRouter, createWebHistory } from 'vue-router'
import PlantsView from '../views/PlantsView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: PlantsView,
  },
  {
    path: '/login', 
    name: 'login',
    component: () => import(/* webpackChunkName: "about" */ '../views/LoginView.vue')
  },
  {
    path: '/register', 
    name: 'register',
    component: () => import(/* webpackChunkName: "about" */ '../views/RegisterView.vue')
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
