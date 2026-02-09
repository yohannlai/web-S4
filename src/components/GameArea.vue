<template>
  <section class="game-area">
    <div v-if="isLoading" class="loader">Recherche d’un film…</div>
    <div v-else-if="noMovies" class="loader">Aucun film disponible pour l’instant</div>

    <div v-else class="movie-grid">
      <!-- Poster géant -->
      <div class="poster-card card">
        <img :src="posterUrl" alt="Affiche du film" />
      </div>

      <!-- Partie droite : grille imbriquée -->
      <div class="right-grid">
        <!-- Ligne du haut : genres + année -->
        <div class="top-right">
          <div class="genres-card card">
            <p>{{ genres.join(", ") }}</p>
          </div>
          <div class="year-card card">
            <p>{{ year }}</p>
          </div>
        </div>

        <!-- Ligne du bas : réalisateur + acteurs -->
        <div class="bottom-right">
          <div class="director-card card">
            <p>{{ director }}</p>
          </div>
          <div class="actors-card card">
            <p>{{ actors.join(", ") }}</p>
          </div>
        </div>

        <!-- Bouton révéler le titre -->
        <div class="reveal-card card">
          <button @click="showTitle = true">Révéler le titre</button>
          <p v-if="showTitle" class="title">{{ title }}</p>
        </div>
      </div>
    </div>
</section>
</template>

<script setup>
import { ref, onMounted } from "vue"

const posterUrl = ref("")
const year = ref("")
const genres = ref([])
const director = ref("")
const actors = ref([])
const title = ref("")
const showTitle = ref(false)
const isLoading = ref(true)
const noMovies = ref(false)

const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500"

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function fetchRandomMovie() {
  let attempts = 0
  let movieFound = false

  while (!movieFound && attempts < 5) {
    attempts++
    const randomYear = randomBetween(1960, 2015)
    const randomPage = randomBetween(1, 10)

    const discoverRes = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=fr-FR&sort_by=vote_average.desc&vote_count.gte=500&vote_average.gte=6.5&primary_release_year=${randomYear}&page=${randomPage}`
    )

    const discoverData = await discoverRes.json()
    const movies = discoverData.results
    if (!movies || movies.length === 0) continue

    const randomMovie = movies[randomBetween(0, movies.length - 1)]
    if (!randomMovie.poster_path) continue

    const movieRes = await fetch(
      `https://api.themoviedb.org/3/movie/${randomMovie.id}?api_key=${API_KEY}&language=fr-FR`
    )
    const movieData = await movieRes.json()

    posterUrl.value = IMAGE_BASE + movieData.poster_path
    year.value = movieData.release_date?.slice(0, 4) || "—"
    genres.value = movieData.genres.map(g => g.name)
    title.value = movieData.title

    const creditsRes = await fetch(
      `https://api.themoviedb.org/3/movie/${randomMovie.id}/credits?api_key=${API_KEY}`
    )
    const creditsData = await creditsRes.json()

    director.value =
      creditsData.crew.find((p) => p.job === "Director")?.name || "Inconnu"
    actors.value = creditsData.cast.slice(0, 3).map((a) => a.name)

    movieFound = true
    isLoading.value = false
  }

  // Si on atteint 5 essais sans résultat
  if (!movieFound) {
    isLoading.value = false
    noMovies.value = true
  }
}

onMounted(fetchRandomMovie)
</script>

<style scoped>
.game-area {
  min-height: calc(100vh - 160px);
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loader {
  font-family: "Playfair Display", serif;
  font-style: italic;
  font-size: 1.4rem;
  color: #000;
  opacity: 0.6;
  text-align: center;
}

.movie-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  width: 95%;
  max-width: 1200px;
  margin: 0 auto;
}

/* Poster */
.poster-card img {
  width: 100%;
  max-height: 550px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid black;
}

/* Partie droite */
.right-grid {
  display: grid;
  grid-template-rows: auto auto auto;
  gap: 1rem;
}

/* Ligne du haut : genres + année */
.top-right {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* Ligne du bas : réalisateur + acteurs */
.bottom-right {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* Blocs génériques */
.card {
  background: #f6f0eb;
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Année plus grosse */
.year-card p {
  font-size: 2rem;
  font-weight: bold;
  margin: 0;
}

/* Genres */
.genres-card p {
  font-weight: 600;
  margin: 0;
}

/* Bouton révéler le titre */
.reveal-card {
  flex-direction: column;
}

.reveal-card button {
  padding: 0.6rem 1rem;
  border: 1px solid black;
  border-radius: 8px;
  cursor: pointer;
  background: none;
  font-family: inherit;
  margin-bottom: 0.5rem;
}

/* Titre */
.title {
  font-family: "Playfair Display", serif;
  font-style: italic;
  font-size: 1.4rem;
  margin-top: 0.5rem;
}

/* Loader */
.loader {
  font-family: "Playfair Display", serif;
  font-style: italic;
  font-size: 1.4rem;
  color: #000;
  opacity: 0.6;
  text-align: center;
}
</style>
