import { createRouter, createWebHistory } from 'vue-router'

const GamePage = () => import('./pages/GamePage.vue')
const MovieDetails = () => import('./pages/MovieDetails.vue')
const CollectionPage = () => import('./pages/CollectionPage.vue')

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
  },
  {
    path: '/collection',
    component: CollectionPage,
    name: 'collection'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
