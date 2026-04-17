import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

const GamePage = () => import('./pages/GamePage.vue')
const MovieDetails = () => import('./pages/MovieDetails.vue')

const routes = [
  {
    path: '/',
    component: GamePage,
    name: 'game'
  },
  {
    path: '/film/:id',
    component: MovieDetails,
    name: 'movie-details'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
