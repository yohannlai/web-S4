<template>
  <section class="game-area">
    <div v-if="isLoading" class="loader">Recherche d’un film…</div>
    <div v-else-if="noMovies" class="loader">Aucun film disponible pour l’instant</div>

    <div v-else class="game-shell">
      <div class="game-toolbar">
        <button v-if="!roundCompleted" class="toolbar-btn pass-btn" @click="skipMovie">
          Passer
        </button>
        <div v-else class="toolbar-spacer"></div>

        <div class="score-zone">
          <button
            class="toolbar-btn score-btn"
            @click="toggleHistory"
            title="Voir l'historique de la partie"
            aria-label="Voir l'historique de la partie"
          >
            <span class="score-label">SCORE</span>
            <span class="score-value">{{ totalScore }}</span>
            <span class="score-hint">Historique</span>
          </button>
          <p v-if="!roundCompleted" class="time-bonus">Bonus temps: +{{ currentTimeBonus }}</p>
        </div>

        <button v-if="roundCompleted" class="toolbar-btn next-btn" @click="fetchRandomMovie">
          Suivant
        </button>
        <div v-else class="toolbar-spacer"></div>
      </div>

      <div class="movie-grid">
      <div
        class="poster-card card"
        :class="{ 'locked': !revealedCards.poster, 'reveal-burst': isRevealAnimating && animateCards.poster }"
      >
        <img v-if="revealedCards.poster" :src="posterUrl" alt="Affiche du film" />
        <div v-else class="hidden-content">
          <p class="hidden-label">
            <span>🔒 </span>Affiche
          </p>
        </div>
      </div>

      <div class="right-grid">

        <div class="top-right">
          <div
            class="genres-card card"
            :class="{ 'clickable': !revealedCards.genres, 'reveal-burst': isRevealAnimating && animateCards.genres }"
            @click="revealedCards.genres = true"
          >
            <div v-if="revealedCards.genres" class="revealed-content">
              <p>{{ genres.join(", ") }}</p>
            </div>
            <div v-else class="hidden-content">
              <p class="hidden-label">Genre</p>
            </div>
          </div>

          <div
            class="card year-card"
            :class="[revealedCards.year ? decadeClass : '', { 'clickable': !revealedCards.year, 'reveal-burst': isRevealAnimating && animateCards.year }]"
            @click="revealedCards.year = true"
          >
            <div v-if="revealedCards.year" class="revealed-content">
              <p class="revealed-year">{{ year }}</p>
            </div>
            <div v-else class="hidden-content">
              <p class="hidden-label">Année</p>
            </div>
          </div>
        </div>

        <div class="bottom-right">
          <div
            class="director-card card"
            :class="{ 'clickable': !revealedCards.director, 'reveal-burst': isRevealAnimating && animateCards.director }"
            @click="revealedCards.director = true"
          >
             <div v-if="revealedCards.director" class="revealed-content">
              <p>{{ director }}</p>
            </div>
            <div v-else class="hidden-content">
              <p class="hidden-label">Réalisateur</p>
            </div>
          </div>

          <div
            class="actors-card card"
            :class="{ 'clickable': !revealedCards.actors, 'reveal-burst': isRevealAnimating && animateCards.actors }"
            @click="revealedCards.actors = true"
          >
             <div v-if="revealedCards.actors" class="revealed-content">
              <p>{{ actors.join(", ") }}</p>
            </div>
            <div v-else class="hidden-content">
              <p class="hidden-label">Acteurs</p>
            </div>
          </div>
        </div>

        <div class="title-card card" :class="{ 'locked': !revealedCards.title, 'reveal-burst': isRevealAnimating && animateCards.title }">
           <div v-if="revealedCards.title" class="revealed-content">
             <p class="revealed-title">{{ title }}</p>
             <p v-if="originalTitle" class="original-title">({{ originalTitle }})</p>
           </div>
           <div v-else class="hidden-content">
             <p class="hidden-label">
               <span>🔒 </span>Titre
             </p>
           </div>
        </div>

      </div>
      </div>
    </div>

    <!-- SEARCH BAR -->
    <div class="search-section" v-if="!isLoading && !noMovies">
      <div class="search-container" :class="searchFeedbackClass">
        <div class="search-input-wrap">
          <input
            v-model="searchInput"
            @input="updateSuggestions"
            @keydown="handleSearchKeydown"
            type="text"
            placeholder="Devinez le titre du film..."
            class="search-input"
            :disabled="roundCompleted"
          />

          <!-- SUGGESTIONS -->
          <div v-if="suggestions.length > 0" class="suggestions-dropdown">
            <div
              v-for="(suggestion, index) in suggestions"
              :key="suggestion.id"
              @click="selectSuggestion(suggestion)"
              class="suggestion-item"
              :class="{ 'active': highlightedSuggestionIndex === index }"
            >
              <span class="suggestion-title">{{ suggestion.title }}</span>
              <span v-if="suggestion.showOriginal" class="suggestion-original">({{ suggestion.originalTitle }})</span>
            </div>
          </div>
        </div>
        <button @click="validateGuess" class="validate-btn" :disabled="!searchInput.trim() || roundCompleted">
          ✓
        </button>
      </div>
    </div>
  </section>

  <div v-if="isHistoryOpen" class="history-overlay" @click.self="isHistoryOpen = false">
    <div class="history-modal">
      <div class="history-header">
        <h3>Historique de la partie</h3>
        <button class="history-close" @click="isHistoryOpen = false">Fermer</button>
      </div>

      <div class="history-summary">
        <p>Score total: <strong>{{ totalScore }}</strong></p>
        <p>Série actuelle: <strong>{{ streak }}</strong></p>
      </div>

      <div v-if="gameHistory.length === 0" class="history-empty">
        Aucune manche jouée pour l'instant.
      </div>

      <ul v-else class="history-list">
        <li v-for="entry in gameHistory" :key="entry.id" class="history-item">
          <div class="history-topline">
            <span>Manche {{ entry.round }} - {{ entry.title }}</span>
            <strong :class="entry.passed ? 'history-passed' : 'history-points'">
              {{ entry.passed ? "Passé" : `+${entry.points}` }}
            </strong>
          </div>
          <p class="history-details">
            {{ entry.passed ? "Film passé" : `Indices: ${entry.revealedHints} • Erreurs: ${entry.wrongGuesses} • Temps: ${entry.elapsedSeconds}s • x${entry.streakMultiplier.toFixed(2)}` }}
          </p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, computed } from "vue"

const COMPETITIVE_CONFIG = {
  basePoints: 100,
  minFoundPoints: 20,
  hintPenalties: {
    genres: 15,
    year: 20,
    director: 25,
    actors: 30
  },
  wrongGuessPenalty: 5,
  maxWrongGuessPenalty: 20,
  timeWindowSeconds: 60,
  timeBonusStepSeconds: 3,
  storageKey: "cinelogique_competitive_state_v1",
  resetOnReloadKey: "cinelogique_competitive_reset_on_reload_v1"
}

// --- CARDS STATE ---
const revealedCards = reactive({
  poster: false,
  genres: false,
  year: false,
  director: false,
  actors: false,
  title: false
})

const posterUrl = ref("")
const year = ref("")
const genres = ref([])
const director = ref("")
const actors = ref([])
const title = ref("")
const originalTitle = ref("")
const isLoading = ref(true)
const noMovies = ref(false)
const decadeClass = ref("")
const currentMovieId = ref(null)

// --- SEARCH BAR STATE ---
const searchInput = ref("")
const suggestions = ref([])
const searchFeedback = ref(null) // 'correct' | 'incorrect' | null
const searchFeedbackClass = computed(() => searchFeedback.value)
const roundCompleted = ref(false)
const isRevealAnimating = ref(false)
const highlightedSuggestionIndex = ref(-1)
const wrongGuesses = ref(0)
const roundStartedAt = ref(Date.now())
const nowTimestamp = ref(Date.now())
const totalScore = ref(0)
const streak = ref(0)
const gameHistory = ref([])
const isHistoryOpen = ref(false)
let timerInterval = null

const animateCards = reactive({
  poster: false,
  genres: false,
  year: false,
  director: false,
  actors: false,
  title: false
})

const elapsedSeconds = computed(() => {
  if (roundCompleted.value) return 0
  return Math.max(0, Math.floor((nowTimestamp.value - roundStartedAt.value) / 1000))
})

const currentTimeBonus = computed(() => getTimeBonus(elapsedSeconds.value))

const hasProgressToLose = computed(() => {
  const hasScoreOrHistory = totalScore.value > 0 || gameHistory.value.length > 0
  const activeRound = !isLoading.value && !noMovies.value && !roundCompleted.value
  return hasScoreOrHistory || activeRound
})

function setDecadeFont(year) {
  const decade = Math.floor(year / 10) * 10
  const classes = {
    1950: "year-50", 1960: "year-60", 1970: "year-70",
    1980: "year-80", 1990: "year-90", 2000: "year-2000",
    2010: "year-2010"
  }
  decadeClass.value = classes[decade] || "year-2020"
}

const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500"

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function normalizeTitle(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function revealAllCards() {
  Object.keys(revealedCards).forEach((key) => {
    animateCards[key] = !revealedCards[key]
    revealedCards[key] = true
  })

  isRevealAnimating.value = true
  setTimeout(() => {
    isRevealAnimating.value = false
    Object.keys(animateCards).forEach((key) => {
      animateCards[key] = false
    })
  }, 500)
}

function getHintPenalty() {
  let penalty = 0
  if (revealedCards.genres) penalty += COMPETITIVE_CONFIG.hintPenalties.genres
  if (revealedCards.year) penalty += COMPETITIVE_CONFIG.hintPenalties.year
  if (revealedCards.director) penalty += COMPETITIVE_CONFIG.hintPenalties.director
  if (revealedCards.actors) penalty += COMPETITIVE_CONFIG.hintPenalties.actors
  return penalty
}

function getWrongGuessPenalty() {
  return Math.min(
    wrongGuesses.value * COMPETITIVE_CONFIG.wrongGuessPenalty,
    COMPETITIVE_CONFIG.maxWrongGuessPenalty
  )
}

function getTimeBonus(durationSeconds) {
  return Math.max(
    0,
    Math.floor((COMPETITIVE_CONFIG.timeWindowSeconds - durationSeconds) / COMPETITIVE_CONFIG.timeBonusStepSeconds)
  )
}

function getStreakMultiplier(nextStreak) {
  if (nextStreak >= 5) return 1.2
  if (nextStreak >= 3) return 1.1
  return 1
}

function buildRoundEntry({ passed, points = 0, revealedHints = 0, elapsed = 0, streakMultiplier = 1 }) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    round: gameHistory.value.length + 1,
    movieId: currentMovieId.value,
    title: title.value,
    originalTitle: originalTitle.value,
    passed,
    points,
    revealedHints,
    wrongGuesses: wrongGuesses.value,
    elapsedSeconds: elapsed,
    streakMultiplier,
    playedAt: new Date().toISOString()
  }
}

function saveCompetitiveState() {
  const payload = {
    totalScore: totalScore.value,
    streak: streak.value,
    gameHistory: gameHistory.value
  }
  localStorage.setItem(COMPETITIVE_CONFIG.storageKey, JSON.stringify(payload))
}

function loadCompetitiveState() {
  try {
    const raw = localStorage.getItem(COMPETITIVE_CONFIG.storageKey)
    if (!raw) return
    const parsed = JSON.parse(raw)
    totalScore.value = Number(parsed.totalScore) || 0
    streak.value = Number(parsed.streak) || 0
    gameHistory.value = Array.isArray(parsed.gameHistory) ? parsed.gameHistory : []
  } catch (error) {
    console.error("Erreur de lecture du cache compétitif:", error)
  }
}

function resetCompetitiveState() {
  totalScore.value = 0
  streak.value = 0
  gameHistory.value = []
  isHistoryOpen.value = false
  localStorage.removeItem(COMPETITIVE_CONFIG.storageKey)
}

function toggleHistory() {
  isHistoryOpen.value = !isHistoryOpen.value
}

function handleNewGameRequested() {
  resetCompetitiveState()
  fetchRandomMovie()
}

function handleBeforeUnload(event) {
  if (!hasProgressToLose.value) return
  event.preventDefault()
  event.returnValue = "Etes-vous sur de vouloir quitter la partie en cours ? Vous allez perdre votre progression."
}

function handlePageHide() {
  if (!hasProgressToLose.value) return
  localStorage.setItem(COMPETITIVE_CONFIG.resetOnReloadKey, "1")
}

async function updateSuggestions() {
  highlightedSuggestionIndex.value = -1

  if (!searchInput.value.trim()) {
    suggestions.value = []
    return
  }

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=fr-FR&query=${encodeURIComponent(searchInput.value)}`
    )
    const data = await res.json()
    suggestions.value = data.results.slice(0, 5).map(movie => ({
      id: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      showOriginal:
        movie.original_language !== "fr" &&
        movie.original_title &&
        movie.original_title !== movie.title
    }))
  } catch (error) {
    console.error("Erreur suggestions:", error)
    suggestions.value = []
  }
}

function selectSuggestion(suggestion) {
  searchInput.value = suggestion.title
  suggestions.value = []
  highlightedSuggestionIndex.value = -1
  validateGuess()
}

function syncInputWithHighlightedSuggestion() {
  if (highlightedSuggestionIndex.value < 0 || highlightedSuggestionIndex.value >= suggestions.value.length) return

  searchInput.value = suggestions.value[highlightedSuggestionIndex.value].title
}

function handleSearchKeydown(event) {
  if (roundCompleted.value) return

  if (event.key === "ArrowDown" && suggestions.value.length > 0) {
    event.preventDefault()
    highlightedSuggestionIndex.value =
      highlightedSuggestionIndex.value < suggestions.value.length - 1
        ? highlightedSuggestionIndex.value + 1
        : 0
    syncInputWithHighlightedSuggestion()
    return
  }

  if (event.key === "ArrowUp" && suggestions.value.length > 0) {
    event.preventDefault()
    highlightedSuggestionIndex.value =
      highlightedSuggestionIndex.value > 0
        ? highlightedSuggestionIndex.value - 1
        : suggestions.value.length - 1
    syncInputWithHighlightedSuggestion()
    return
  }

  if (event.key === "Enter") {
    event.preventDefault()
    if (highlightedSuggestionIndex.value >= 0 && highlightedSuggestionIndex.value < suggestions.value.length) {
      selectSuggestion(suggestions.value[highlightedSuggestionIndex.value])
      return
    }
    validateGuess()
  }

  if (event.key === "Escape") {
    suggestions.value = []
    highlightedSuggestionIndex.value = -1
  }
}

function validateGuess() {
  if (!searchInput.value.trim() || roundCompleted.value) return

  const guess = normalizeTitle(searchInput.value)
  const expectedTitles = [normalizeTitle(title.value), normalizeTitle(originalTitle.value)].filter(Boolean)
  const correct = expectedTitles.includes(guess)

  if (correct) {
    const elapsed = Math.max(0, Math.floor((Date.now() - roundStartedAt.value) / 1000))
    const hintPenalty = getHintPenalty()
    const wrongPenalty = getWrongGuessPenalty()
    const timeBonus = getTimeBonus(elapsed)
    const nextStreak = streak.value + 1
    const streakMultiplier = getStreakMultiplier(nextStreak)
    const rawScore = COMPETITIVE_CONFIG.basePoints - hintPenalty - wrongPenalty + timeBonus
    const safeScore = Math.max(COMPETITIVE_CONFIG.minFoundPoints, rawScore)
    const finalScore = Math.round(safeScore * streakMultiplier)

    totalScore.value += finalScore
    streak.value = nextStreak
    gameHistory.value.unshift(
      buildRoundEntry({
        passed: false,
        points: finalScore,
        revealedHints: [revealedCards.genres, revealedCards.year, revealedCards.director, revealedCards.actors].filter(Boolean).length,
        elapsed,
        streakMultiplier
      })
    )
    saveCompetitiveState()

    searchFeedback.value = 'correct'
    revealAllCards()
    roundCompleted.value = true
    searchInput.value = ""
    suggestions.value = []

    setTimeout(() => {
      searchFeedback.value = null
    }, 800)
  } else {
    wrongGuesses.value += 1
    searchFeedback.value = 'incorrect'
    suggestions.value = []
    setTimeout(() => {
      searchFeedback.value = null
    }, 600)
    searchInput.value = ""
  }
}

async function fetchRandomMovie() {
  Object.keys(revealedCards).forEach(key => revealedCards[key] = false)
  Object.keys(animateCards).forEach(key => animateCards[key] = false)
  isLoading.value = true
  noMovies.value = false
  roundCompleted.value = false
  isRevealAnimating.value = false
  searchInput.value = ""
  suggestions.value = []
  searchFeedback.value = null
  highlightedSuggestionIndex.value = -1
  wrongGuesses.value = 0
  roundStartedAt.value = Date.now()
  nowTimestamp.value = Date.now()
  currentMovieId.value = null

  let attempts = 0
  let movieFound = false

  while (!movieFound && attempts < 5) {
    attempts++
    const randomYear = randomBetween(1960, 2026)
    const randomPage = randomBetween(1, 5)

    try {
      const discoverRes = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=fr-FR&sort_by=vote_average.desc&vote_count.gte=500&primary_release_year=${randomYear}&page=${randomPage}`
      )
      const discoverData = await discoverRes.json()
      const movies = discoverData.results
      if (!movies?.length) continue

      const randomMovie = movies[randomBetween(0, movies.length - 1)]
      if (!randomMovie.poster_path) continue
      currentMovieId.value = randomMovie.id

      const movieRes = await fetch(`https://api.themoviedb.org/3/movie/${randomMovie.id}?api_key=${API_KEY}&language=fr-FR`)
      const movieData = await movieRes.json()

      const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${randomMovie.id}/credits?api_key=${API_KEY}`)
      const creditsData = await creditsRes.json()

      posterUrl.value = IMAGE_BASE + movieData.poster_path
      year.value = movieData.release_date?.slice(0, 4)
      setDecadeFont(Number(year.value))
      genres.value = movieData.genres.map(g => g.name)
      title.value = movieData.title

      if (movieData.original_language !== 'fr' && movieData.original_title !== movieData.title)
      {
        originalTitle.value = movieData.original_title
      }
      else
      {
        originalTitle.value = ""
      }

      const allDirectors = creditsData.crew.filter(p => p.job === "Director")
      if (allDirectors.length > 0)
      {
        director.value = allDirectors.map(d => d.name).join(", ")
      }
      else
      {
        director.value = "Inconnu"
      }

      actors.value = creditsData.cast.slice(0, 3).map(a => a.name)

      movieFound = true
    } catch (error) {
      console.error("Erreur API:", error)
    }
  }
  isLoading.value = false
  if (!movieFound) noMovies.value = true
}

function skipMovie() {
  if (roundCompleted.value) return

  gameHistory.value.unshift(
    buildRoundEntry({
      passed: true,
      points: 0,
      revealedHints: [revealedCards.genres, revealedCards.year, revealedCards.director, revealedCards.actors].filter(Boolean).length,
      elapsed: Math.max(0, Math.floor((Date.now() - roundStartedAt.value) / 1000)),
      streakMultiplier: 1
    })
  )
  streak.value = 0
  saveCompetitiveState()

  revealAllCards()
  roundCompleted.value = true
  searchInput.value = ""
  suggestions.value = []
  searchFeedback.value = null
  highlightedSuggestionIndex.value = -1
}

onMounted(() => {
  const mustResetAfterReload = localStorage.getItem(COMPETITIVE_CONFIG.resetOnReloadKey) === "1"
  if (mustResetAfterReload) {
    localStorage.removeItem(COMPETITIVE_CONFIG.resetOnReloadKey)
    resetCompetitiveState()
  } else {
    loadCompetitiveState()
  }

  fetchRandomMovie()
  timerInterval = window.setInterval(() => {
    nowTimestamp.value = Date.now()
  }, 1000)
  window.addEventListener("cine:new-game", handleNewGameRequested)
  window.addEventListener("beforeunload", handleBeforeUnload)
  window.addEventListener("pagehide", handlePageHide)
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  window.removeEventListener("cine:new-game", handleNewGameRequested)
  window.removeEventListener("beforeunload", handleBeforeUnload)
  window.removeEventListener("pagehide", handlePageHide)
})
</script>

<style scoped>
/* --- VARIABLES --- */
:root {
  --shadow-soft: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-hover: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* --- GLOBAL LAYOUT --- */
.game-area {
  min-height: calc(100vh - 100px);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-page);
  transition: background-color 0.3s ease;
  font-family: 'Outfit', sans-serif;
}

.game-shell {
  width: 100%;
  max-width: 1100px;
}

.game-toolbar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.toolbar-spacer {
  width: 1px;
  height: 1px;
}

.toolbar-btn {
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-main);
  border-radius: 999px;
  padding: 0.5rem 1rem;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-soft);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.toolbar-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.pass-btn {
  color: #b91c1c;
}

.next-btn {
  color: #0f766e;
}

.score-btn {
  color: #1d4ed8;
  display: inline-flex;
  align-items: baseline;
  gap: 0.45rem;
  padding: 0.55rem 1rem;
  border-width: 2px;
}

.score-btn:hover,
.score-btn:focus-visible {
  transform: translateY(-2px);
}

.score-label {
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  font-weight: 800;
  color: #2563eb;
}

.score-value {
  font-size: 1.25rem;
  line-height: 1;
  font-weight: 900;
  color: var(--text-main);
}

.score-hint {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 700;
  padding-left: 0.45rem;
  border-left: 1px solid color-mix(in srgb, var(--text-muted) 45%, transparent);
}

.score-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

.time-bonus {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
}

.movie-grid {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 1.5rem;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

/* --- GENERIC CARD --- */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  border-radius: 12px;
  padding: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  box-shadow: var(--shadow-soft);
  height: 100%;
  width: 100%;
  position: relative;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
  overflow: hidden;
}

.reveal-burst {
  animation: revealFlip 0.5s ease;
}

/* --- INTERACTION --- */
.clickable {
  cursor: pointer;
  border: 1px solid var(--border-color);
}

.clickable:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
  border-color: #cbd5e1;
}

/* --- HIDDEN CONTENT --- */
.hidden-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-hidden);
  border: 2px dashed var(--border-dashed);
  border-radius: 8px;
  box-sizing: border-box;
}

.hidden-label {
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--text-hidden);
  margin: 0;
}

/* --- REVEALED CONTENT --- */
.revealed-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  animation: fadeIn 0.4s ease-out;
}

.locked {
  cursor: not-allowed;
  opacity: 0.7;
  border-color: transparent;
}

.locked:hover {
  transform: none;
  box-shadow: var(--shadow-soft);
}

.revealed-title {
  font-family: "Playfair Display", serif;
  font-style: italic;
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
  line-height: 1.2;
  padding: 0 10px;
}

.original-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1rem;
  color: var(--text-muted);
  margin: 0.3rem 0 0 0;
  font-style: italic;
  font-weight: 400;
  animation: fadeInUp 0.5s ease-out;
}

.revealed-year {
  font-size: 6rem;
  font-weight: 900;
  margin: 0;
  line-height: 1;
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* --- DECADES STYLES --- */
.year-50 .revealed-year { font-family: "Lobster", cursive; color: #d97706; }
.year-60 .revealed-year { font-family: "Risque", cursive; color: #ea580c; }
.year-70 .revealed-year { font-family: "Luckiest Guy", cursive; color: #b45309; letter-spacing: 0.05em; }
.year-80 .revealed-year { font-family: "Audiowide", cursive; color: #7c3aed; }
.year-90 .revealed-year { font-family: "Black Ops One", cursive; color: #be123c; }
.year-2000 .revealed-year { font-family: "Montserrat", sans-serif; color: #0369a1; }
.year-2010 .revealed-year { font-family: "Poppins", sans-serif; color: #0f766e; }
.year-2020 .revealed-year { font-family: "Space Grotesk", sans-serif; color: #4338ca; }

/* --- OTHER TEXTS (GENRES, ACTORS...) --- */
.genres-card .revealed-content p,
.director-card .revealed-content p,
.actors-card .revealed-content p {
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  font-size: 1.2rem;
  color: var(--text-main);
  margin: 0;
  line-height: 1.4;
}

/* --- POSTER --- */
.poster-card {
  height: 525px;
  padding: 0.5rem;
}

.poster-card:has(img) {
  padding: 0;
  border: none;
}

.poster-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
  display: block;
}

/* --- GRIDS --- */
.right-grid {
  display: grid;
  grid-template-rows: 1fr 1fr 0.8fr;
  gap: 1.5rem;
  height: 525px;
}

.top-right, .bottom-right {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

/* --- ANIMATIONS --- */
@keyframes popIn {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- LOADER --- */
.loader {
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  font-size: 1.2rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 2px;
}

/* --- SEARCH BAR --- */
.search-section {
  width: 100%;
  max-width: 1100px;
  margin: 2rem auto 0 auto;
  padding: 0;
  position: relative;
}

.search-container {
  display: flex;
  gap: 1rem;
  position: relative;
  width: 100%;
}

.search-input-wrap {
  flex: 1;
  width: 100%;
  position: relative;
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 1rem;
  font-family: 'Outfit', sans-serif;
  font-size: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  background-color: var(--bg-card);
  color: var(--text-main);
  transition: all 0.3s ease;
  box-shadow: var(--shadow-soft);
}

.search-input:focus {
  outline: none;
  border-color: #4338ca;
  box-shadow: var(--shadow-hover);
}

.search-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-input::placeholder {
  color: var(--text-hidden);
}

.validate-btn {
  padding: 1rem 1.5rem;
  background-color: var(--bg-card);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  color: var(--text-main);
  font-family: 'Outfit', sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-soft);
}

.validate-btn:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
  border-color: #cbd5e1;
}

.validate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* FEEDBACK STATES */
.search-container.correct .search-input,
.search-container.correct .validate-btn {
  border-color: #10b981 !important;
  background-color: rgba(16, 185, 129, 0.1);
  animation: correctFeedback 0.8s ease-out;
}

.search-container.incorrect .search-input,
.search-container.incorrect .validate-btn {
  border-color: #ef4444 !important;
  background-color: rgba(239, 68, 68, 0.1);
  animation: incorrectFeedback 0.6s ease-out;
}

/* SUGGESTIONS DROPDOWN */
.suggestions-dropdown {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 0;
  width: 100%;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-hover);
  max-height: 300px;
  overflow-y: auto;
  z-index: 10;
}

.suggestion-item {
  display: flex;
  gap: 0.35rem;
  align-items: baseline;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  color: var(--text-main);
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--border-color);
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background-color: color-mix(in srgb, var(--bg-hidden) 75%, var(--bg-card));
  padding-left: 1.5rem;
}

.suggestion-item.active {
  background-color: color-mix(in srgb, var(--bg-hidden) 75%, var(--bg-card));
  padding-left: 1.5rem;
}

.suggestion-title {
  color: var(--text-main);
}

.suggestion-original {
  color: var(--text-muted);
  font-style: italic;
}

/* ANIMATIONS */
@keyframes correctFeedback {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes incorrectFeedback {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

@keyframes revealFlip {
  0% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(90deg);
  }
  100% {
    transform: rotateY(0deg);
  }
}

.history-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  padding: 1rem;
}

.history-modal {
  width: min(700px, 100%);
  max-height: 80vh;
  overflow: auto;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  box-shadow: var(--shadow-hover);
  padding: 1rem;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.history-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.history-close {
  border: 1px solid var(--border-color);
  background: var(--bg-hidden);
  color: var(--text-main);
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
}

.history-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  color: var(--text-main);
}

.history-summary p {
  margin: 0;
}

.history-empty {
  margin-top: 1rem;
  color: var(--text-muted);
}

.history-list {
  list-style: none;
  margin: 1rem 0 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.history-item {
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 0.75rem;
  background: color-mix(in srgb, var(--bg-hidden) 45%, var(--bg-card));
}

.history-topline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.history-details {
  margin: 0.4rem 0 0 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.history-points {
  color: #0f766e;
}

.history-passed {
  color: #b91c1c;
}

@media (max-width: 760px) {
  .game-toolbar {
    flex-wrap: wrap;
    justify-content: center;
  }

  .history-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
  }
}
</style>
