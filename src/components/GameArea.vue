<template>
  <section class="game-area">
    <div v-if="isLoading" class="loader">Recherche d’un film…</div>
    <div v-else-if="noMovies" class="loader">Aucun film disponible pour l’instant</div>

    <div v-else class="movie-grid">
      <div
        class="poster-card card clickable"
        @click="revealedCards.poster = true"
      >
        <img v-if="revealedCards.poster" :src="posterUrl" alt="Affiche du film" />
        <div v-else class="hidden-content">
          <p class="hidden-label">Affiche</p>
        </div>
      </div>

      <div class="right-grid">

        <div class="top-right">
          <div class="genres-card card clickable" @click="revealedCards.genres = true">
            <div v-if="revealedCards.genres" class="revealed-content">
              <p>{{ genres.join(", ") }}</p>
            </div>
            <div v-else class="hidden-content">
              <p class="hidden-label">Genre</p>
            </div>
          </div>

          <div class="card year-card clickable" :class="[revealedCards.year ? decadeClass : '']" @click="revealedCards.year = true">
            <div v-if="revealedCards.year" class="revealed-content">
              <p class="revealed-year">{{ year }}</p>
            </div>
            <div v-else class="hidden-content">
              <p class="hidden-label">Année</p>
            </div>
          </div>
        </div>

        <div class="bottom-right">
          <div class="director-card card clickable" @click="revealedCards.director = true">
             <div v-if="revealedCards.director" class="revealed-content">
              <p>{{ director }}</p>
            </div>
            <div v-else class="hidden-content">
              <p class="hidden-label">Réalisateur</p>
            </div>
          </div>

          <div class="actors-card card clickable" @click="revealedCards.actors = true">
             <div v-if="revealedCards.actors" class="revealed-content">
              <p>{{ actors.join(", ") }}</p>
            </div>
            <div v-else class="hidden-content">
              <p class="hidden-label">Acteurs</p>
            </div>
          </div>
        </div>

        <div class="title-card card clickable" @click="revealedCards.title = true">
           <div v-if="revealedCards.title" class="revealed-content">
             <p class="revealed-title">{{ title }}</p>
           </div>
           <div v-else class="hidden-content">
             <p class="hidden-label">Titre</p>
           </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, reactive } from "vue"

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
const isLoading = ref(true)
const noMovies = ref(false)
const decadeClass = ref("")

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

async function fetchRandomMovie() {
  Object.keys(revealedCards).forEach(key => revealedCards[key] = false)
  isLoading.value = true

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

      const movieRes = await fetch(`https://api.themoviedb.org/3/movie/${randomMovie.id}?api_key=${API_KEY}&language=fr-FR`)
      const movieData = await movieRes.json()

      const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${randomMovie.id}/credits?api_key=${API_KEY}`)
      const creditsData = await creditsRes.json()

      posterUrl.value = IMAGE_BASE + movieData.poster_path
      year.value = movieData.release_date?.slice(0, 4)
      setDecadeFont(Number(year.value))
      genres.value = movieData.genres.map(g => g.name)
      title.value = movieData.title

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

onMounted(fetchRandomMovie)
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
  justify-content: center;
  align-items: center;
  background-color: var(--bg-page);
  transition: background-color 0.3s ease;
  font-family: 'Outfit', sans-serif;
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

/* --- LOADER --- */
.loader {
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  font-size: 1.2rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 2px;
}
</style>
