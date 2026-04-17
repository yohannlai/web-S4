const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function fetchJson(path, params = {}) {
  const searchParams = new URLSearchParams({ api_key: API_KEY, ...params })
  const response = await fetch(`${TMDB_BASE_URL}${path}?${searchParams.toString()}`)
  return response.json()
}

export async function fetchMovieSuggestions(query) {
  const data = await fetchJson("/search/movie", {
    language: "fr-FR",
    query
  })

  return (data.results || []).slice(0, 5).map((movie) => ({
    id: movie.id,
    title: movie.title,
    originalTitle: movie.original_title,
    showOriginal:
      movie.original_language !== "fr" &&
      movie.original_title &&
      movie.original_title !== movie.title
  }))
}

export async function fetchRandomRoundMovie({ minYear = 1960, maxYear = 2026, maxAttempts = 5 } = {}) {
  let attempts = 0

  while (attempts < maxAttempts) {
    attempts += 1
    const randomYear = randomBetween(minYear, maxYear)
    const randomPage = randomBetween(1, 5)

    const discoverData = await fetchJson("/discover/movie", {
      language: "fr-FR",
      sort_by: "vote_average.desc",
      "vote_count.gte": 500,
      primary_release_year: randomYear,
      page: randomPage
    })

    const movies = discoverData.results
    if (!movies?.length) continue

    const randomMovie = movies[randomBetween(0, movies.length - 1)]
    if (!randomMovie.poster_path) continue

    const [movieData, creditsData] = await Promise.all([
      fetchJson(`/movie/${randomMovie.id}`, { language: "fr-FR" }),
      fetchJson(`/movie/${randomMovie.id}/credits`)
    ])

    const allDirectors = (creditsData.crew || []).filter((person) => person.job === "Director")

    return {
      movieId: randomMovie.id,
      posterUrl: IMAGE_BASE_URL + movieData.poster_path,
      year: movieData.release_date?.slice(0, 4) || "",
      genres: (movieData.genres || []).map((genre) => genre.name),
      title: movieData.title || "",
      originalTitle:
        movieData.original_language !== "fr" && movieData.original_title !== movieData.title
          ? movieData.original_title
          : "",
      director: allDirectors.length > 0 ? allDirectors.map((person) => person.name).join(", ") : "Inconnu",
      actors: (creditsData.cast || []).slice(0, 3).map((actor) => actor.name)
    }
  }

  return null
}

export async function fetchMovieDetailsById(movieId) {
  try {
    const [movieData, creditsData] = await Promise.all([
      fetchJson(`/movie/${movieId}`, { language: "fr-FR" }),
      fetchJson(`/movie/${movieId}/credits`)
    ])

    const allDirectors = (creditsData.crew || []).filter((person) => person.job === "Director")
    const allActors = (creditsData.cast || []).slice(0, 10).map((actor) => actor.name)

    return {
      movieId: movieId,
      posterUrl: movieData.poster_path ? IMAGE_BASE_URL + movieData.poster_path : null,
      year: movieData.release_date?.slice(0, 4) || "",
      genres: (movieData.genres || []).map((genre) => genre.name),
      title: movieData.title || "",
      originalTitle:
        movieData.original_language !== "fr" && movieData.original_title !== movieData.title
          ? movieData.original_title
          : "",
      director: allDirectors.length > 0 ? allDirectors.map((person) => person.name).join(", ") : "Inconnu",
      actors: allActors,
      synopsis: movieData.overview || "Aucune synopsis disponible",
      runtime: movieData.runtime || 0,
      rating: movieData.vote_average || 0,
      language: movieData.original_language || "",
      budget: movieData.budget || 0,
      revenue: movieData.revenue || 0
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des détails du film:", error)
    return null
  }
}
