<template>
  <div class="movie-details-container">
    <div class="movie-details-header">
      <button class="back-btn" @click="goBack" title="Retour au jeu">
        ← Retour
      </button>
      <h1>Détails du film</h1>
      <button
        class="back-btn topbar-action-btn"
        @click="toggleFullscreen"
        :title="isFullscreen ? 'Quitter le plein écran' : 'Activer le plein écran'"
        :aria-label="isFullscreen ? 'Quitter le plein écran' : 'Activer le plein écran'"
      >
        {{ isFullscreen ? '✕' : '⛶' }}
      </button>
    </div>

    <div v-if="isLoading" class="loader">Chargement des détails...</div>
    <div v-else-if="!movieData" class="error-message">Impossible de charger les détails du film</div>

    <div v-else class="movie-details-content">
      <div class="movie-poster-section">
        <img v-if="movieData.posterUrl" :src="movieData.posterUrl" :alt="movieData.title" class="movie-poster" />
        <div v-else class="poster-placeholder">Pas d'affiche disponible</div>
      </div>

      <div class="movie-info-section">
        <div class="movie-meta">
          <div class="meta-left">
            <div class="meta-title-block">
              <h2 class="movie-title">{{ movieData.title }}</h2>
              <p v-if="movieData.originalTitle" class="original-title">{{ movieData.originalTitle }}</p>
            </div>
            <div class="meta-stats">
              <div v-if="movieData.year" class="meta-item">
                <span class="meta-label">Année :</span>
                <span class="meta-value">{{ movieData.year }}</span>
              </div>
              <div v-if="movieData.runtime" class="meta-item">
                <span class="meta-label">Durée :</span>
                <span class="meta-value">{{ formatRuntime(movieData.runtime) }}</span>
              </div>
              <div v-if="movieData.rating" class="meta-item">
                <span class="meta-label">Note TMDB :</span>
                <span class="meta-value">{{ movieData.rating.toFixed(1) }}/10</span>
              </div>
            </div>
          </div>

          <div class="meta-actions">
            <button
              class="details-action-btn seen-btn"
              :class="{ active: isCurrentMovieSeen }"
              @click="handleSeenMovie"
              title="Marquer comme vu"
            >
              📽️ J'AI VU CE FILM !
            </button>
            <button
              class="details-action-btn watch-btn"
              :class="{ active: isCurrentMovieWatchlist }"
              @click="handleWatchlistMovie"
              title="Ajouter aux films à voir"
            >
              🍿 À VOIR !
            </button>
            <button
              class="details-action-btn collection-btn"
              @click="goToCollection"
              title="Voir ma collection"
            >
              🎟️ MA COLLECTION
            </button>
          </div>
        </div>

        <div v-if="movieData.genres.length > 0" class="genres-section">
          <span class="section-label">Genres :</span>
          <div class="genres-list">
            <span v-for="genre in movieData.genres" :key="genre" class="genre-tag">
              {{ genre }}
            </span>
          </div>
        </div>

        <div v-if="movieData.director" class="credits-section">
          <span class="section-label">Réalisateur :</span>
          <p class="credit-value">{{ movieData.director }}</p>
        </div>

        <div v-if="movieData.actors.length > 0" class="credits-section">
          <span class="section-label">Acteurs principaux :</span>
          <p class="credit-value">{{ movieData.actors.join(", ") }}</p>
        </div>

        <div class="synopsis-section">
          <span class="section-label">Synopsis :</span>
          <p class="synopsis-text">{{ movieData.synopsis }}</p>
        </div>

        <div v-if="movieData.budget > 0 || movieData.revenue > 0" class="budget-section">
          <div v-if="movieData.budget > 0" class="budget-item">
            <span class="meta-label">Budget :</span>
            <span class="meta-value">${{ formatNumber(movieData.budget) }}</span>
          </div>
          <div v-if="movieData.revenue > 0" class="budget-item">
            <span class="meta-label">Revenus :</span>
            <span class="meta-value">${{ formatNumber(movieData.revenue) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { fetchMovieDetailsById } from '../services/api/tmdb.service'
import {
  isMovieInSeenCollection,
  isMovieInWatchlistCollection,
  removeSeenMovie,
  removeWatchlistMovie,
  toggleSeenMovie,
  toggleWatchlistMovie
} from '../services/game/collection.service'

const router = useRouter()
const route = useRoute()
const movieData = ref(null)
const isLoading = ref(true)
const isCurrentMovieSeen = ref(false)
const isCurrentMovieWatchlist = ref(false)
const isFullscreen = ref(Boolean(document.fullscreenElement))

function syncFullscreenState() {
  isFullscreen.value = Boolean(document.fullscreenElement)
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }

    await document.documentElement.requestFullscreen()
  } catch (error) {
    console.error('Impossible de changer le mode plein écran:', error)
  }
}

function getCurrentMovieId() {
  return Number(route.params.id)
}

function createCollectionPayload() {
  if (!movieData.value) return null

  return {
    movieId: getCurrentMovieId(),
    title: movieData.value.title,
    originalTitle: movieData.value.originalTitle,
    posterUrl: movieData.value.posterUrl,
    year: movieData.value.year
  }
}

function syncCollectionButtonStates() {
  const movieId = getCurrentMovieId()
  if (!movieId) {
    isCurrentMovieSeen.value = false
    isCurrentMovieWatchlist.value = false
    return
  }

  isCurrentMovieSeen.value = isMovieInSeenCollection(movieId)
  isCurrentMovieWatchlist.value = isMovieInWatchlistCollection(movieId)
}

function formatNumber(num) {
  return num.toLocaleString('fr-FR')
}

function formatRuntime(runtimeMinutes) {
  const total = Number(runtimeMinutes || 0)
  if (!total) return '0 min'

  const hours = Math.floor(total / 60)
  const minutes = total % 60

  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`

  return `${hours} h ${String(minutes).padStart(2, '0')}`
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }

  if (route.query.from === 'collection') {
    router.push({ name: 'collection', query: { tab: typeof route.query.tab === 'string' ? route.query.tab : 'found' } })
    return
  }

  router.push({ name: 'game' })
}

function goToCollection() {
  router.push({ name: 'collection', query: { tab: 'found' } })
}

function handleSeenMovie() {
  const payload = createCollectionPayload()
  if (!payload) return

  if (!isCurrentMovieSeen.value && isCurrentMovieWatchlist.value) {
    removeWatchlistMovie(payload.movieId)
    isCurrentMovieWatchlist.value = false
  }

  isCurrentMovieSeen.value = toggleSeenMovie(payload)
}

function handleWatchlistMovie() {
  const payload = createCollectionPayload()
  if (!payload) return

  if (!isCurrentMovieWatchlist.value && isCurrentMovieSeen.value) {
    removeSeenMovie(payload.movieId)
    isCurrentMovieSeen.value = false
  }

  isCurrentMovieWatchlist.value = toggleWatchlistMovie(payload)
}

async function loadMovieDetails() {
  const movieId = route.params.id

  if (!movieId) {
    router.push({ name: 'game' })
    return
  }

  try {
    const data = await fetchMovieDetailsById(movieId)
    if (data) {
      movieData.value = data
      syncCollectionButtonStates()
    } else {
      console.error('Impossible de charger les détails du film')
    }
  } catch (error) {
    console.error('Erreur lors du chargement des détails:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', syncFullscreenState)
  loadMovieDetails()
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', syncFullscreenState)
})
</script>

<style scoped>
.movie-details-container {
  min-height: calc(100vh - 100px);
  padding: 2.75rem 2rem 2rem;
  background-color: var(--bg-page);
  transition: background-color 0.3s ease;
  color: var(--text-main);
  font-family: 'Outfit', sans-serif;
}

.movie-details-header {
  display: grid;
  grid-template-columns: 120px 1fr 120px;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.back-btn {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  padding: 0.5rem 1rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.movie-details-header h1 {
  margin: 0;
  text-align: center;
  font-size: 1.5rem;
  align-self: end;
  transform: translateY(3px);
}

.topbar-action-btn {
  width: 120px;
  padding: 0.5rem;
}

.loader {
  text-align: center;
  padding: 3rem;
  font-size: 1.1rem;
  color: var(--text-muted);
}

.error-message {
  text-align: center;
  padding: 2rem;
  color: #dc2626;
  font-size: 1rem;
}

.movie-details-content {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 3rem;
  max-width: 1200px;
  margin: 0 auto;
}

.movie-poster-section {
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.movie-poster {
  width: 100%;
  max-width: 350px;
  height: auto;
  border-radius: 12px;
  box-shadow: none;
  object-fit: contain;
  display: block;
}

.poster-placeholder {
  width: 100%;
  max-width: 350px;
  height: 500px;
  background: var(--bg-card);
  border: 2px dashed var(--border-dashed);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  text-align: center;
  padding: 2rem;
}

.movie-info-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.movie-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-main);
  font-family: "Playfair Display", serif;
  font-style: italic;
}

.original-title {
  margin: 0.3rem 0 0 0;
  font-size: 1rem;
  color: var(--text-muted);
  font-style: italic;
}

.meta-title-block {
  width: 100%;
}

.meta-left {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  min-width: 0;
  flex: 1;
}

.movie-meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2rem;
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.meta-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1.4rem;
}

.meta-actions {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  align-items: stretch;
  min-width: 220px;
}

.details-action-btn {
  border: 2px solid currentColor;
  background: var(--bg-card);
  border-radius: 999px;
  padding: 0.46rem 0.9rem;
  font-family: 'Outfit', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.details-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.seen-btn {
  color: #be185d;
}

.seen-btn:hover {
  background-color: rgba(190, 24, 93, 0.08);
}

.seen-btn.active {
  background-color: #be185d;
  color: #ffffff;
  border-color: #be185d;
}

.watch-btn {
  color: #7e22ce;
}

.watch-btn.active {
  background-color: #7e22ce;
  color: #ffffff;
  border-color: #7e22ce;
}

.collection-btn {
  border-radius: 12px;
  color: #b88900;
}

.collection-btn:hover {
  background-color: rgba(184, 137, 0, 0.12);
}

.meta-item {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.meta-label {
  font-weight: 700;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.meta-value {
  color: var(--text-main);
  font-weight: 600;
}

.genres-section,
.credits-section,
.synopsis-section,
.budget-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-label {
  font-weight: 800;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.genres-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.genre-tag {
  background: #1d4ed8;
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

[data-theme="dark"] .genre-tag {
  background: #1e40af;
}

.credit-value {
  margin: 0;
  color: var(--text-main);
  line-height: 1.6;
}

.synopsis-text {
  margin: 0;
  color: var(--text-main);
  line-height: 1.7;
  font-size: 0.95rem;
}

.budget-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.budget-item {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .movie-details-content {
    grid-template-columns: 1fr;
  }

  .movie-poster {
    max-width: 100%;
  }

  .movie-title {
    font-size: 1.5rem;
  }

  .movie-meta {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .meta-actions {
    min-width: 0;
  }
}
</style>
