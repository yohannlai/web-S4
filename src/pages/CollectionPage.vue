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

        <button
          class="back-btn topbar-action-btn"
          @click="toggleFullscreen"
          :title="isFullscreen ? 'Quitter le plein écran' : 'Activer le plein écran'"
          :aria-label="isFullscreen ? 'Quitter le plein écran' : 'Activer le plein écran'"
        >
          {{ isFullscreen ? '✕' : '⛶' }}
        </button>
      </div>

      <div ref="tabsSentinelRef" class="tabs-sentinel" aria-hidden="true"></div>
      <div ref="tabsWrapRef" class="collection-tabs-wrap">
        <div class="collection-tabs" role="tablist" aria-label="Onglets de collection">
          <button class="tab-btn" :class="{ active: activeTab === 'found' }" @click="switchTab('found')" role="tab" :aria-selected="activeTab === 'found'">
            Films trouvés
          </button>
          <button class="tab-btn" :class="{ active: activeTab === 'seen' }" @click="switchTab('seen')" role="tab" :aria-selected="activeTab === 'seen'">
            Films vus
          </button>
          <button class="tab-btn" :class="{ active: activeTab === 'watchlist' }" @click="switchTab('watchlist')" role="tab" :aria-selected="activeTab === 'watchlist'">
            Films à voir
          </button>
        </div>
        <button
          v-if="showScrollTopButton"
          class="tab-btn scroll-top-btn"
          @click="scrollToTop"
          title="Remonter en haut"
          aria-label="Remonter en haut"
        >
          ↑ Haut
        </button>
      </div>

      <section class="tab-panel" role="tabpanel">
        <p v-if="activeMovies.length === 0" class="placeholder-text">
          {{
            activeTab === 'found'
              ? 'Aucun film trouvé pour le moment.'
              : activeTab === 'seen'
                ? 'Aucun film vu pour le moment.'
                : 'Aucun film à voir pour le moment.'
          }}
        </p>

        <div v-else class="poster-grid">
          <article
            v-for="movie in activeMovies"
            :key="`${activeTab}-${movie.movieId}`"
            class="poster-tile"
            :class="{ removable: true }"
            @click="openMovieDetails(movie)"
            @keydown.enter.prevent="openMovieDetails(movie)"
            @keydown.space.prevent="openMovieDetails(movie)"
            role="button"
            tabindex="0"
            :aria-label="`Ouvrir les details de ${movie.title}`"
          >
            <div class="tile-poster-wrap">
              <img v-if="movie.posterUrl" :src="movie.posterUrl" :alt="movie.title" class="tile-poster" />
              <div v-else class="tile-poster placeholder-poster">
                <span>Pas d'affiche</span>
              </div>

              <button
                class="remove-btn"
                title="Retirer de la collection"
                aria-label="Retirer de la collection"
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
import { useFullscreen } from '../composables/useFullscreen'
import {
  getMovieCollection,
  removeFoundMovie,
  removeSeenMovie,
  removeWatchlistMovie
} from '../services/game/collection.service'

const route = useRoute()
const router = useRouter()
const collection = ref(getMovieCollection())
const { isFullscreen, toggleFullscreen } = useFullscreen()
const tabsWrapRef = ref(null)
const tabsSentinelRef = ref(null)
const showScrollTopButton = ref(false)
let tabsObserver = null

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

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function setupScrollTopObserver() {
  const sentinel = tabsSentinelRef.value
  if (!sentinel) {
    showScrollTopButton.value = false
    return
  }

  tabsObserver = new IntersectionObserver(
    ([entry]) => {
      showScrollTopButton.value = !entry.isIntersecting
    },
    {
      root: null,
      threshold: 0,
      rootMargin: '-6px 0px 0px 0px'
    }
  )

  tabsObserver.observe(sentinel)
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
  setupScrollTopObserver()
})

onUnmounted(() => {
  tabsObserver?.disconnect()
  tabsObserver = null
  window.removeEventListener('cine:collection-updated', reloadCollection)
})
</script>

<style scoped>
.tabs-sentinel {
  height: 1px;
}

.collection-main {
  min-height: calc(100vh - 100px);
  padding: 2.75rem 2rem 2rem;
}

.collection-shell {
  max-width: 1100px;
  margin: 0 auto;
}

.collection-topbar {
  display: grid;
  grid-template-columns: 120px 1fr 120px;
  gap: 1rem;
  align-items: center;
}

@media (max-width: 1024px) {
  .collection-topbar {
    grid-template-columns: 120px 1fr;
  }

  .topbar-action-btn {
    display: none;
  }
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

.topbar-action-btn {
  width: 120px;
  padding: 0.5rem;
}

.collection-header {
  align-self: end;
  margin-left: 1.1rem;
  transform: translateY(12px);
}

.collection-header h1 {
  margin: 0;
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  font-style: italic;
  color: #b88900;
}

.collection-header p {
  margin: 0.45rem 0 0 0;
  color: var(--text-muted);
  font-family: 'Outfit', sans-serif;
}

.collection-tabs-wrap {
  margin-top: 2.25rem;
  display: flex;
  gap: 0.65rem;
  align-items: center;
  flex-wrap: wrap;
  position: sticky;
  top: 0.75rem;
  z-index: 20;
  background: color-mix(in srgb, var(--bg-page) 92%, transparent);
  padding: 0.55rem 0.45rem;
  border-radius: 14px;
  backdrop-filter: blur(4px);
}

.collection-tabs {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
  flex: 1;
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
  border-color: #b88900;
  color: #b88900;
}

.scroll-top-btn {
  border-color: #b88900;
  color: #b88900;
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

.poster-tile:focus-visible {
  outline: 3px solid #b88900;
  outline-offset: 2px;
}

.tile-poster-wrap {
  position: relative;
}

.poster-tile.removable:hover .remove-btn {
  opacity: 1;
  transform: translateY(0);
}

.poster-tile.removable:focus-within .remove-btn {
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

  .collection-header {
    margin-left: 0;
    transform: none;
  }

  .topbar-spacer {
    display: none;
  }

  .collection-tabs-wrap {
    top: 0.4rem;
  }
}
</style>
