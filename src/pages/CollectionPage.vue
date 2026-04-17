<template>
  <main class="collection-main">
    <section class="collection-shell">
      <div class="collection-topbar">
        <button class="back-btn" @click="goBack" title="Retour à la page précédente">
          ← Retour
        </button>

        <header class="collection-header">
          <h1>Ma collection</h1>
          <p>Retrouve tous les films que tu as marqués pendant tes parties.</p>
        </header>

        <div class="topbar-spacer"></div>
      </div>

      <div class="collection-tabs" role="tablist" aria-label="Onglets de collection">
        <button class="tab-btn" :class="{ active: activeTab === 'found' }" @click="switchTab('found')" role="tab">
          Films trouvés
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'seen' }" @click="switchTab('seen')" role="tab">
          Films vus
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'watchlist' }" @click="switchTab('watchlist')" role="tab">
          Films à voir
        </button>
      </div>

      <section class="tab-panel" role="tabpanel">
        <p v-if="activeMovies.length === 0" class="placeholder-text">
          {{
            activeTab === 'found'
              ? 'Aucun film trouvé pour le moment.'
              : activeTab === 'seen'
                ? 'Aucun film vu pour le moment.'
                : 'Aucun film dans "Films à voir" pour le moment.'
          }}
        </p>

        <div v-else class="poster-grid">
          <article
            v-for="movie in activeMovies"
            :key="`${activeTab}-${movie.movieId}`"
            class="poster-tile"
            :class="{ removable: true }"
            @click="openMovieDetails(movie)"
          >
            <div class="tile-poster-wrap">
              <img v-if="movie.posterUrl" :src="movie.posterUrl" :alt="movie.title" class="tile-poster" />
              <div v-else class="tile-poster placeholder-poster">
                <span>Pas d'affiche</span>
              </div>

              <button
                class="remove-btn"
                title="Retirer de la collection"
                @click.stop="removeMovie(movie)"
              >
                −
              </button>
            </div>
            <div class="tile-meta">
              <h3>{{ movie.title }}</h3>
              <p>{{ movie.year || 'Année inconnue' }}</p>
            </div>
          </article>
        </div>
      </section>
    </section>
  </main>

</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getMovieCollection,
  removeFoundMovie,
  removeSeenMovie,
  removeWatchlistMovie
} from '../services/game/collection.service'

const route = useRoute()
const router = useRouter()
const collection = ref(getMovieCollection())

const validTabs = ['found', 'seen', 'watchlist']

const activeTab = computed(() => {
  const tabQuery = typeof route.query.tab === 'string' ? route.query.tab : 'found'
  return validTabs.includes(tabQuery) ? tabQuery : 'found'
})

const activeMovies = computed(() => {
  if (activeTab.value === 'seen') return collection.value.seen
  if (activeTab.value === 'found') return collection.value.found
  return collection.value.watchlist
})

function reloadCollection() {
  collection.value = getMovieCollection()
}

function switchTab(tab) {
  router.replace({ name: 'collection', query: { tab } })
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push({ name: 'game' })
}

function openMovieDetails(movie) {
  if (!movie?.movieId) return

  router.push({
    name: 'movie-details',
    params: { id: movie.movieId },
    query: { from: 'collection', tab: activeTab.value }
  })
}

function removeMovie(movie) {
  if (!movie?.movieId) return

  if (activeTab.value === 'seen') {
    removeSeenMovie(movie.movieId)
  } else if (activeTab.value === 'found') {
    removeFoundMovie(movie.movieId)
  } else {
    removeWatchlistMovie(movie.movieId)
  }

  reloadCollection()
}

onMounted(() => {
  reloadCollection()
  window.addEventListener('cine:collection-updated', reloadCollection)
})

onUnmounted(() => {
  window.removeEventListener('cine:collection-updated', reloadCollection)
})
</script>

<style scoped>
.collection-main {
  min-height: calc(100vh - 100px);
  padding: 2rem;
}

.collection-shell {
  max-width: 1100px;
  margin: 0 auto;
}

.collection-topbar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  align-items: center;
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

.topbar-spacer {
  width: 70px;
}

.collection-header h1 {
  margin: 0;
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  font-style: italic;
}

.collection-header p {
  margin: 0.45rem 0 0 0;
  color: var(--text-muted);
  font-family: 'Outfit', sans-serif;
}

.collection-tabs {
  margin-top: 1.5rem;
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.tab-btn {
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-main);
  border-radius: 999px;
  padding: 0.5rem 1rem;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tab-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.tab-btn.active {
  border-color: #1d4ed8;
  color: #1d4ed8;
}

.tab-panel {
  margin-top: 1.25rem;
}

.placeholder-text {
  color: var(--text-muted);
  font-family: 'Outfit', sans-serif;
  padding: 1.25rem 0;
}

.poster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 1rem;
}

.poster-tile {
  position: relative;
  cursor: pointer;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.poster-tile:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 18px -4px rgba(0, 0, 0, 0.14);
}

.tile-poster-wrap {
  position: relative;
}

.poster-tile.removable:hover .remove-btn {
  opacity: 1;
  transform: translateY(0);
}

.tile-poster {
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  display: block;
}

.remove-btn {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 1px solid #991b1b;
  background: #dc2626;
  color: #ffffff;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.2s ease, transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.18);
}

.remove-btn:hover {
  background: #b91c1c;
  border-color: #7f1d1d;
}

.placeholder-poster {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-hidden);
  color: var(--text-muted);
  font-family: 'Outfit', sans-serif;
  font-size: 0.85rem;
}

.tile-meta {
  padding: 0.65rem;
}

.tile-meta h3 {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.25;
  font-family: 'Outfit', sans-serif;
  font-style: italic;
}

.tile-meta p {
  margin: 0.35rem 0 0 0;
  color: var(--text-muted);
  font-family: 'Outfit', sans-serif;
  font-size: 0.83rem;
}

@media (max-width: 760px) {
  .collection-topbar {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }

  .topbar-spacer {
    display: none;
  }
}
</style>
