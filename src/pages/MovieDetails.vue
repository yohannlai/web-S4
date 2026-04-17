<template>
  <div class="movie-details-container">
    <div class="movie-details-header">
      <button class="back-btn" @click="goBack" title="Retour au jeu">
        ← Retour
      </button>
      <h1>Détails du film</h1>
      <div class="header-spacer"></div>
    </div>

    <div v-if="isLoading" class="loader">Chargement des détails...</div>
    <div v-else-if="!movieData" class="error-message">Impossible de charger les détails du film</div>

    <div v-else class="movie-details-content">
      <div class="movie-poster-section">
        <img v-if="movieData.posterUrl" :src="movieData.posterUrl" :alt="movieData.title" class="movie-poster" />
        <div v-else class="poster-placeholder">Pas d'affiche disponible</div>
      </div>

      <div class="movie-info-section">
        <h2 class="movie-title">{{ movieData.title }}</h2>
        <p v-if="movieData.originalTitle" class="original-title">{{ movieData.originalTitle }}</p>

        <div class="movie-meta">
          <div v-if="movieData.year" class="meta-item">
            <span class="meta-label">Année :</span>
            <span class="meta-value">{{ movieData.year }}</span>
          </div>
          <div v-if="movieData.runtime" class="meta-item">
            <span class="meta-label">Durée :</span>
            <span class="meta-value">{{ movieData.runtime }} min</span>
          </div>
          <div v-if="movieData.rating" class="meta-item">
            <span class="meta-label">Note TMDB :</span>
            <span class="meta-value">{{ movieData.rating.toFixed(1) }}/10</span>
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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { fetchMovieDetailsById } from '../services/api/tmdb.service'

const router = useRouter()
const route = useRoute()
const movieData = ref(null)
const isLoading = ref(true)

function formatNumber(num) {
  return num.toLocaleString('fr-FR')
}

function goBack() {
  router.push({ name: 'game' })
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
  loadMovieDetails()
})
</script>

<style scoped>
.movie-details-container {
  min-height: calc(100vh - 100px);
  padding: 2rem;
  background-color: var(--bg-page);
  transition: background-color 0.3s ease;
  color: var(--text-main);
  font-family: 'Outfit', sans-serif;
}

.movie-details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  flex: 1;
  text-align: center;
  font-size: 1.5rem;
}

.header-spacer {
  width: 70px;
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
}

.movie-poster {
  width: 100%;
  max-width: 350px;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  object-fit: cover;
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
}

.original-title {
  margin: 0;
  font-size: 1rem;
  color: var(--text-muted);
  font-style: italic;
}

.movie-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
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
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
