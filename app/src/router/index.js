import { createRouter, createWebHistory } from 'vue-router'
import PlantsView from '../views/PlantsView.vue'
import PlantDetail from '../components/PlantDetail.vue'

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
  {
    path: '/plant/:id',
    name: 'plant-detail',
    component: PlantDetail,
    props: true, // Allows passing props via route params
  },
  //catch all redirect to home
  {
    path: '/:catchAll(.*)',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
