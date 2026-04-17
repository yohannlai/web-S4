<template>
  <AppHeader v-if="!isFullscreen" />
  <main class="explorer-main" :class="{ fullscreen: isFullscreen }">
    <section class="explorer-shell">
      <div class="explorer-topbar">
        <button class="back-btn" @click="goBack" title="Retour à la page précédente">← Retour</button>

        <header class="explorer-header">
          <h1>Explorer</h1>
          <p>Fouille les films et muscle ta mémoire pour dominer les manches.</p>
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

      <section class="explorer-controls" aria-label="Filtres et tri des films">
        <label class="control-field search-field">
          <span>Recherche globale</span>
          <input v-model="searchQuery" type="search" placeholder="Ex : Inception, Parasite, Le Parrain..." />
        </label>

        <label class="control-field">
          <span>Tri</span>
          <select v-model="sortMode">
            <option v-for="option in sortOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

        <label class="control-field">
          <span>Genre</span>
          <select v-model="genreFilter">
            <option value="all">Tous les genres</option>
            <option v-for="genre in genreOptions" :key="genre.id" :value="String(genre.id)">
              {{ genre.name }}
            </option>
          </select>
        </label>

        <label class="control-field">
          <span>Pays</span>
          <select v-model="countryFilter">
            <option value="all">Tous les pays</option>
            <option v-for="country in countryOptions" :key="country.code" :value="country.code">
              {{ country.name }}
            </option>
          </select>
        </label>

        <label class="control-field decade-field">
          <span>Décennie</span>
          <select v-model="decadeFilter">
            <option value="all">Toutes les décennies</option>
            <option v-for="decade in decadeOptions" :key="decade.value" :value="decade.value">
              {{ decade.label }}
            </option>
          </select>
        </label>

        <label class="control-field" :class="{ 'control-field-disabled': isYearDisabled }">
          <span>Année</span>
          <select v-model="yearFilter" :disabled="isYearDisabled">
            <option value="all">Toutes les années</option>
            <option v-for="year in yearOptions" :key="year" :value="String(year)">
              {{ year }}
            </option>
          </select>
        </label>
      </section>

      <div class="results-header">
        <p class="results-meta">{{ totalResultsLabel }}</p>
        <button class="back-btn compact-btn" @click="resetFilters">Réinitialiser les filtres</button>
      </div>

      <p v-if="isLoading" class="state-message">Chargement des films...</p>
      <p v-else-if="loadError" class="state-message error-message">{{ loadError }}</p>

      <section v-else class="explorer-results">
        <div v-if="movies.length === 0" class="empty-state">
          <p>Aucun film ne correspond à ces filtres sur cette page.</p>
        </div>

        <div v-else class="poster-grid">
          <article
            v-for="movie in movies"
            :key="movie.movieId"
            class="poster-tile explorer-tile"
            :class="resolveDecadeClass(Number(movie.year) || 0)"
            @click="openMovieDetails(movie)"
          >
            <div class="tile-poster-wrap">
              <img v-if="movie.posterUrl" :src="movie.posterUrl" :alt="movie.title" class="tile-poster" />
              <div v-else class="tile-poster placeholder-poster"><span>Pas d'affiche</span></div>
              <span v-if="movie.year" class="movie-badge">{{ movie.year }}</span>
            </div>

            <div class="tile-meta explorer-meta">
              <h3>{{ movie.title }}</h3>
              <p v-if="movie.originalTitle" class="original-title">{{ movie.originalTitle }}</p>

              <div v-if="movie.genres.length > 0" class="mini-tags">
                <span v-for="genre in movie.genres.slice(0, 3)" :key="genre" class="mini-tag">{{ genre }}</span>
              </div>
            </div>
          </article>
        </div>

        <nav v-if="visiblePageNumbers.length > 1" class="pagination" aria-label="Pagination des films">
          <button class="page-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">←</button>
          <button
            v-for="page in visiblePageNumbers"
            :key="page"
            class="page-btn"
            :class="{ active: page === currentPage }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">→</button>
        </nav>
      </section>
    </section>

    <button class="collection-nav-btn explorer-floating-collection-btn" @click="goToCollection" title="Voir ma collection">
      🎟️ MA COLLECTION
    </button>
  </main>
  <AppFooter v-if="!isFullscreen" />
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppFooter from '../components/AppFooter.vue'
import AppHeader from '../components/AppHeader.vue'
import { fetchMovieCountries, fetchMovieExplorerPage, fetchMovieGenres } from '../services/api/tmdb.service'
import { resolveDecadeClass } from '../utils/movie-game.utils'

const router = useRouter()
const route = useRoute()

const GAME_MIN_YEAR = 1960
const GAME_MAX_YEAR = new Date().getFullYear() + 2
const SEARCH_DEBOUNCE_MS = 350

const movies = ref([])
const genreOptions = ref([])
const countryOptions = ref([])
const isLoading = ref(true)
const loadError = ref('')
const isFullscreen = ref(Boolean(document.fullscreenElement))
const searchQuery = ref('')
const appliedSearchQuery = ref('')
const sortMode = ref('popularity-desc')
const genreFilter = ref('all')
const countryFilter = ref('all')
const decadeFilter = ref('all')
const yearFilter = ref('all')
const currentPage = ref(1)
const totalPages = ref(1)
const totalResults = ref(0)
let searchDebounceTimer = null

const sortOptions = [
  { value: 'popularity-desc', label: 'Plus populaires' },
  { value: 'rating-desc', label: 'Meilleures notes' },
  { value: 'title-asc', label: 'Titre A-Z' },
  { value: 'title-desc', label: 'Titre Z-A' }
]

const isYearDisabled = computed(() => decadeFilter.value === 'all')

const decadeOptions = computed(() => {
  const firstDecade = Math.floor(GAME_MIN_YEAR / 10) * 10
  const lastDecade = Math.floor(GAME_MAX_YEAR / 10) * 10
  const values = []

  for (let decade = firstDecade; decade <= lastDecade; decade += 10) {
    values.push({ value: String(decade), label: `${decade}s` })
  }

  return values
})

const yearOptions = computed(() => {
  if (decadeFilter.value === 'all') return []

  const start = Number(decadeFilter.value)
  if (!start) return []

  const min = Math.max(start, GAME_MIN_YEAR)
  const max = Math.min(start + 9, GAME_MAX_YEAR)
  const years = []

  for (let current = min; current <= max; current += 1) {
    years.push(current)
  }

  return years
})

const totalResultsLabel = computed(() => {
  const movieLabel = totalResults.value <= 1 ? 'film trouvé' : 'films trouvés'
  const queryPart = appliedSearchQuery.value ? ` pour "${appliedSearchQuery.value}"` : ''
  return `${totalResults.value} ${movieLabel}${queryPart} - page ${currentPage.value}/${totalPages.value}`
})

const visiblePageNumbers = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  if (start > 1) pages.unshift(1)
  if (end < totalPages.value) pages.push(totalPages.value)

  return Array.from(new Set(pages))
})

const discoverSortByMap = {
  'popularity-desc': 'popularity.desc',
  'rating-desc': 'vote_average.desc',
  'title-asc': 'original_title.asc',
  'title-desc': 'original_title.desc'
}

function buildRouteQuery() {
  const query = {}

  if (appliedSearchQuery.value) query.q = appliedSearchQuery.value
  if (sortMode.value !== 'popularity-desc') query.sort = sortMode.value
  if (genreFilter.value !== 'all') query.genre = genreFilter.value
  if (countryFilter.value !== 'all') query.country = countryFilter.value
  if (decadeFilter.value !== 'all') query.decade = decadeFilter.value
  if (yearFilter.value !== 'all') query.year = yearFilter.value
  if (currentPage.value > 1) query.page = String(currentPage.value)

  return query
}

async function syncRouteQuery() {
  await router.replace({ name: 'explorer', query: buildRouteQuery() })
}

function goToPage(page) {
  const target = Math.max(1, Math.min(totalPages.value, Number(page) || 1))
  if (target === currentPage.value) return

  currentPage.value = target
}

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

function goBack() {
  if (route.query.origin === 'mode-picker') {
    router.push({ name: 'game' })
    return
  }

  if (window.history.length > 1) {
    router.push({ name: 'game', query: { openRules: '1', newGame: '1' } })
    return
  }

  router.push({ name: 'game', query: { openRules: '1', newGame: '1' } })
}

function openMovieDetails(movie) {
  if (!movie?.movieId) return

  router.push({
    name: 'movie-details',
    params: { id: movie.movieId },
    query: {
      from: 'explorer',
      ...buildRouteQuery()
    }
  })
}

function resetFilters() {
  searchQuery.value = ''
  appliedSearchQuery.value = ''
  sortMode.value = 'popularity-desc'
  genreFilter.value = 'all'
  countryFilter.value = 'all'
  decadeFilter.value = 'all'
  yearFilter.value = 'all'
  currentPage.value = 1
}

function goToCollection() {
  router.push({ name: 'collection', query: { tab: 'found' } })
}

function hydrateFiltersFromRoute() {
  const routeSort = typeof route.query.sort === 'string' ? route.query.sort : 'popularity-desc'
  const validSort = sortOptions.some((option) => option.value === routeSort)

  searchQuery.value = typeof route.query.q === 'string' ? route.query.q : ''
  appliedSearchQuery.value = searchQuery.value
  sortMode.value = validSort ? routeSort : 'popularity-desc'
  genreFilter.value = typeof route.query.genre === 'string' ? route.query.genre : 'all'
  countryFilter.value = typeof route.query.country === 'string' ? route.query.country : 'all'
  decadeFilter.value = typeof route.query.decade === 'string' ? route.query.decade : 'all'
  yearFilter.value = typeof route.query.year === 'string' ? route.query.year : 'all'
  currentPage.value = Math.max(1, Number(route.query.page) || 1)
}

async function loadGenres() {
  genreOptions.value = await fetchMovieGenres()
}

async function loadCountries() {
  const countries = await fetchMovieCountries()
  countryOptions.value = countries.sort((left, right) => left.name.localeCompare(right.name, 'fr'))
}

async function loadMovies() {
  isLoading.value = true
  loadError.value = ''

  try {
    const response = await fetchMovieExplorerPage({
      page: currentPage.value,
      query: appliedSearchQuery.value,
      sortBy: discoverSortByMap[sortMode.value] || 'popularity.desc',
      genreId: genreFilter.value === 'all' ? null : Number(genreFilter.value),
      countryCode: countryFilter.value === 'all' ? null : countryFilter.value,
      decadeStart: decadeFilter.value === 'all' ? null : Number(decadeFilter.value),
      year: yearFilter.value === 'all' ? null : Number(yearFilter.value)
    })

    movies.value = response.movies
    totalPages.value = response.totalPages
    totalResults.value = response.totalResults

    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
      return
    }
  } catch (error) {
    console.error('Erreur lors du chargement des films:', error)
    loadError.value = 'Impossible de charger les films pour le moment.'
  } finally {
    isLoading.value = false
  }
}

watch(searchQuery, (value) => {
  if (searchDebounceTimer) window.clearTimeout(searchDebounceTimer)

  searchDebounceTimer = window.setTimeout(() => {
    appliedSearchQuery.value = value.trim()
    currentPage.value = 1
  }, SEARCH_DEBOUNCE_MS)
})

watch(decadeFilter, (value) => {
  if (value === 'all') {
    yearFilter.value = 'all'
    return
  }

  if (!yearOptions.value.includes(Number(yearFilter.value))) {
    yearFilter.value = 'all'
  }
})

watch([appliedSearchQuery, sortMode, genreFilter, countryFilter, decadeFilter, yearFilter], async () => {
  currentPage.value = 1
  await syncRouteQuery()
  await loadMovies()
})

watch(currentPage, async () => {
  await syncRouteQuery()
  await loadMovies()
})

onMounted(async () => {
  hydrateFiltersFromRoute()
  syncFullscreenState()
  document.addEventListener('fullscreenchange', syncFullscreenState)

  try {
    await Promise.all([loadGenres(), loadCountries()])
  } catch (error) {
    console.error('Erreur lors du chargement des filtres:', error)
  }

  await loadMovies()
})

onUnmounted(() => {
  if (searchDebounceTimer) window.clearTimeout(searchDebounceTimer)
  document.removeEventListener('fullscreenchange', syncFullscreenState)
})
</script>

<style scoped>
.explorer-main {
  min-height: calc(100vh - 100px);
  padding: 2.75rem 2rem 2rem;
}

.explorer-main.fullscreen {
  min-height: 100vh;
}

.explorer-shell {
  max-width: 1240px;
  margin: 0 auto;
}

.explorer-topbar {
  display: grid;
  grid-template-columns: 120px 1fr 120px;
  gap: 1rem;
  align-items: center;
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

.back-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.topbar-action-btn {
  width: 120px;
  padding: 0.5rem;
}

.explorer-header {
  align-self: end;
  margin-left: 1.1rem;
  transform: translateY(12px);
}

.explorer-header h1 {
  margin: 0;
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  font-style: italic;
  color: #111111;
}

[data-theme='dark'] .explorer-header h1 {
  color: #f8fafc;
}

.explorer-header p {
  margin: 0.45rem 0 0 0;
  color: var(--text-muted);
  font-family: 'Outfit', sans-serif;
}

.explorer-controls {
  margin-top: 1.8rem;
  display: grid;
  grid-template-columns: minmax(300px, 1.4fr) minmax(142px, 1fr) minmax(142px, 1fr) minmax(142px, 1fr) minmax(158px, 1.1fr) minmax(142px, 1fr);
  gap: 0.75rem;
  position: sticky;
  top: 0.75rem;
  z-index: 20;
  background: color-mix(in srgb, var(--bg-page) 92%, transparent);
  padding: 0.55rem;
  border-radius: 18px;
  backdrop-filter: blur(4px);
}

.decade-field select {
  min-width: 0;
}

.control-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-family: 'Outfit', sans-serif;
  color: var(--text-muted);
}

.control-field span {
  font-size: 0.84rem;
  font-weight: 700;
}

.control-field input,
.control-field select {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-card);
  color: var(--text-main);
  padding: 0.72rem 0.85rem;
  font: inherit;
  outline: none;
}

.control-field input:focus,
.control-field select:focus {
  border-color: #111111;
  box-shadow: 0 0 0 3px color-mix(in srgb, #111111 14%, transparent);
}

.control-field-disabled span {
  opacity: 0.6;
}

.control-field-disabled select {
  filter: grayscale(1);
  opacity: 0.55;
  cursor: not-allowed;
}

.search-field {
  grid-column: auto;
}

.collection-nav-btn {
  padding: 0.82rem 1.05rem;
  background-color: color-mix(in srgb, var(--bg-page) 92%, transparent);
  border: 2px solid #b88900;
  border-radius: 12px;
  color: #b88900;
  font-family: 'Outfit', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.collection-nav-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  background-color: var(--bg-card);
}

[data-theme='dark'] .collection-nav-btn {
  background-color: color-mix(in srgb, var(--bg-page) 92%, transparent);
}

[data-theme='dark'] .collection-nav-btn:hover {
  background-color: var(--bg-card);
}

.explorer-floating-collection-btn {
  position: fixed;
  right: max(2rem, env(safe-area-inset-right));
  bottom: max(2rem, env(safe-area-inset-bottom));
  z-index: 35;
  white-space: nowrap;
}

.results-header {
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.results-meta {
  margin: 0;
  color: var(--text-muted);
  font-family: 'Outfit', sans-serif;
}

.compact-btn {
  padding-inline: 0.8rem;
}

.state-message {
  margin-top: 1.5rem;
  color: var(--text-muted);
  font-family: 'Outfit', sans-serif;
}

.error-message {
  color: #ef4444;
}

.explorer-results {
  margin-top: 1rem;
}

.empty-state {
  margin-top: 1.5rem;
  padding: 2rem;
  border: 1px dashed var(--border-color);
  border-radius: 20px;
  text-align: center;
  color: var(--text-muted);
  background: color-mix(in srgb, var(--bg-card) 88%, transparent);
}

.poster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.2rem;
}

.poster-tile {
  border-radius: 18px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  overflow: hidden;
}

.explorer-tile {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.explorer-tile:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 26px -18px rgba(0, 0, 0, 0.45);
}

.tile-poster-wrap {
  position: relative;
  aspect-ratio: 2 / 3;
  background: color-mix(in srgb, var(--bg-hidden) 45%, var(--bg-card));
}

.tile-poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.placeholder-poster {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-family: 'Outfit', sans-serif;
  color: var(--text-muted);
}

.movie-badge {
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  background: rgba(17, 24, 39, 0.78);
  color: #fff;
  border-radius: 999px;
  padding: 0.35rem 0.55rem;
  font-size: 0.75rem;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
}

.explorer-meta {
  padding: 0.85rem 0.9rem 1rem;
}

.explorer-meta h3 {
  margin: 0;
  font-family: 'Playfair Display', serif;
  font-size: 1.1rem;
  line-height: 1.2;
  color: var(--text-main);
  font-style: italic;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.explorer-meta p {
  margin: 0.35rem 0 0;
  font-family: 'Outfit', sans-serif;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.original-title {
  font-style: italic;
}

.mini-tags {
  margin-top: 0.6rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.mini-tag {
  border-radius: 999px;
  padding: 0.28rem 0.55rem;
  background: color-mix(in srgb, var(--bg-hidden) 35%, var(--bg-card));
  color: var(--text-main);
  font-family: 'Outfit', sans-serif;
  font-size: 0.74rem;
  border: 1px solid var(--border-color);
}

.pagination {
  margin-top: 1.2rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
}

.page-btn {
  min-width: 2.2rem;
  height: 2.2rem;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: var(--bg-card);
  color: var(--text-main);
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  cursor: pointer;
}

.page-btn.active {
  background: #111111;
  border-color: #111111;
  color: #ffffff;
}

.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 1120px) {
  .explorer-controls {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .explorer-main {
    padding-inline: 1rem;
  }

  .explorer-topbar {
    grid-template-columns: 1fr;
    justify-items: stretch;
  }

  .explorer-header {
    margin-left: 0;
    transform: none;
  }

  .topbar-action-btn {
    width: 100%;
  }

  .explorer-controls {
    grid-template-columns: 1fr;
  }

  .explorer-floating-collection-btn {
    width: 100%;
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
