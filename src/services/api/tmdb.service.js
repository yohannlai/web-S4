const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"
export const gameRoundModes = {
  CLASSIC: 'classic',
  NOW_PLAYING: 'now-playing',
  UPCOMING: 'upcoming'
}
const NOW_PLAYING_WINDOW_DAYS = 42
const UPCOMING_WINDOW_YEARS = 2
const regionDisplayNames =
  typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['fr'], { type: 'region' })
    : null

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function toFrenchCountryName(countryCode, fallbackName = '') {
  if (!countryCode) return fallbackName || ''

  const normalizedCode = String(countryCode).toUpperCase()
  return regionDisplayNames?.of(normalizedCode) || fallbackName || normalizedCode
}

function getTodayDateIso() {
  return new Date().toISOString().slice(0, 10)
}

function shiftTodayIso({ days = 0, years = 0 } = {}) {
  const date = new Date()

  if (years) {
    date.setFullYear(date.getFullYear() + years)
  }

  if (days) {
    date.setDate(date.getDate() + days)
  }

  return date.toISOString().slice(0, 10)
}

function normalizeReleaseDate(releaseDate) {
  if (!releaseDate || typeof releaseDate !== 'string') return ''
  return releaseDate.slice(0, 10)
}

function isReleaseDateInGameWindow(releaseDate, gameMode = gameRoundModes.CLASSIC) {
  const normalizedDate = normalizeReleaseDate(releaseDate)
  if (!normalizedDate) return false

  const todayIso = getTodayDateIso()

  if (gameMode === gameRoundModes.NOW_PLAYING) {
    const minIso = shiftTodayIso({ days: -NOW_PLAYING_WINDOW_DAYS })
    return normalizedDate >= minIso && normalizedDate <= todayIso
  }

  if (gameMode === gameRoundModes.UPCOMING) {
    const maxIso = shiftTodayIso({ years: UPCOMING_WINDOW_YEARS })
    return normalizedDate > todayIso && normalizedDate <= maxIso
  }

  return normalizedDate <= todayIso
}

function isReleaseDateWithinExplorerWindow(releaseDate) {
  const normalizedDate = normalizeReleaseDate(releaseDate)
  if (!normalizedDate) return false

  const maxIso = shiftTodayIso({ years: UPCOMING_WINDOW_YEARS })
  return normalizedDate <= maxIso
}

async function fetchJson(path, params = {}) {
  const searchParams = new URLSearchParams({ api_key: API_KEY, ...params })
  const response = await fetch(`${TMDB_BASE_URL}${path}?${searchParams.toString()}`)
  return response.json()
}

async function fetchGenreMap() {
  const data = await fetchJson('/genre/movie/list', {
    language: 'fr-FR'
  })

  return new Map((data.genres || []).map((genre) => [genre.id, genre.name]))
}

function mapMovieSummary(movie, genreMap = new Map()) {
  return {
    movieId: movie.id,
    posterUrl: movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : null,
    year: movie.release_date?.slice(0, 4) || '',
    genres: (movie.genre_ids || []).map((genreId) => genreMap.get(genreId)).filter(Boolean),
    title: movie.title || '',
    originalTitle:
      movie.original_language !== 'fr' && movie.original_title !== movie.title ? movie.original_title : '',
    rating: movie.vote_average || 0,
    popularity: movie.popularity || 0,
    voteCount: movie.vote_count || 0,
    synopsis: movie.overview || ''
  }
}

function isPlayableMovieForGame(
  movieData,
  creditsData,
  gameMode = gameRoundModes.CLASSIC,
  { ignoreReleaseWindow = false } = {}
) {
  const hasReleaseDate = Boolean(movieData?.release_date?.slice(0, 4))
  const isReleased = ignoreReleaseWindow || isReleaseDateInGameWindow(movieData?.release_date, gameMode)
  const hasGenres = Array.isArray(movieData?.genres) && movieData.genres.length > 0
  const hasDirectors = (creditsData?.crew || []).some((person) => person.job === 'Director' && person.name)
  const hasActors = (creditsData?.cast || []).some((actor) => actor.name)
  const hasPoster = Boolean(movieData?.poster_path)

  return hasPoster && hasReleaseDate && isReleased && hasGenres && hasDirectors && hasActors
}

async function fetchMovieDataAndCredits(movieId) {
  const [movieData, creditsData] = await Promise.all([
    fetchJson(`/movie/${movieId}`, { language: 'fr-FR' }),
    fetchJson(`/movie/${movieId}/credits`)
  ])

  return { movieData, creditsData }
}

export async function fetchMovieGenres() {
  const data = await fetchJson('/genre/movie/list', {
    language: 'fr-FR'
  })

  return (data.genres || [])
    .filter((genre) => Number.isFinite(genre.id) && typeof genre.name === 'string' && genre.name)
    .map((genre) => ({ id: genre.id, name: genre.name }))
}

export async function fetchMovieCountries() {
  const data = await fetchJson('/configuration/countries', {
    language: 'fr-FR'
  })

  return (data || [])
    .filter((country) => typeof country.iso_3166_1 === 'string')
    .map((country) => ({
      code: country.iso_3166_1,
      name: toFrenchCountryName(
        country.iso_3166_1,
        country.native_name || country.english_name || country.iso_3166_1
      )
    }))
}

export async function fetchMovieExplorerPage({
  page = 1,
  query = '',
  sortBy = 'popularity.desc',
  genreId = null,
  countryCode = null,
  decadeStart = null,
  year = null,
  includeAdult = false
} = {}) {
  const explorerMaxIso = shiftTodayIso({ years: UPCOMING_WINDOW_YEARS })
  const genreMap = await fetchGenreMap()
  const sanitizedPage = Math.max(1, Number(page) || 1)
  const trimmedQuery = String(query || '').trim()

  if (trimmedQuery) {
    const searchData = await fetchJson('/search/movie', {
      language: 'fr-FR',
      include_adult: includeAdult ? 'true' : 'false',
      query: trimmedQuery,
      page: sanitizedPage,
      ...(year ? { primary_release_year: year } : {})
    })

    const filtered = (searchData.results || [])
      .filter((movie) => movie.poster_path)
      .filter((movie) => isReleaseDateWithinExplorerWindow(movie.release_date))
      .filter((movie) => {
        if (genreId && !(movie.genre_ids || []).includes(genreId)) return false

        const releaseYear = Number(movie.release_date?.slice(0, 4) || 0)
        if (year && releaseYear !== year) return false
        if (decadeStart && (!releaseYear || releaseYear < decadeStart || releaseYear > decadeStart + 9)) return false

        return true
      })

    const entries = await Promise.all(
      filtered.map(async (movie) => {
        try {
          const { movieData, creditsData } = await fetchMovieDataAndCredits(movie.id)
          return { movie, movieData, creditsData }
        } catch {
          return null
        }
      })
    )

    const eligibleMovies = entries
      .filter(Boolean)
      .filter(({ movieData, creditsData }) =>
        isReleaseDateWithinExplorerWindow(movieData?.release_date) &&
        isPlayableMovieForGame(movieData, creditsData, gameRoundModes.CLASSIC, { ignoreReleaseWindow: true })
      )
      .filter(({ movieData }) => {
        if (!countryCode) return true
        return (movieData.production_countries || []).some((country) => country.iso_3166_1 === countryCode)
      })
      .map(({ movie }) => movie)

    return {
      movies: eligibleMovies.map((movie) => mapMovieSummary(movie, genreMap)),
      page: sanitizedPage,
      totalPages: Math.max(1, Math.min(500, Number(searchData.total_pages) || 1)),
      totalResults: Number(searchData.total_results) || eligibleMovies.length
    }
  }

  const discoverData = await fetchJson('/discover/movie', {
    language: 'fr-FR',
    include_adult: includeAdult ? 'true' : 'false',
    sort_by: sortBy,
    page: sanitizedPage,
    'primary_release_date.lte': explorerMaxIso,
    ...(genreId ? { with_genres: genreId } : {}),
    ...(countryCode ? { with_origin_country: countryCode } : {}),
    ...(year
      ? { primary_release_year: year }
      : decadeStart
        ? {
            'primary_release_date.gte': `${decadeStart}-01-01`,
            'primary_release_date.lte': `${decadeStart + 9}-12-31`
          }
        : {})
  })

  const results = (discoverData.results || []).filter((movie) => movie.poster_path)
  const entries = await Promise.all(
    results.map(async (movie) => {
      try {
        const { movieData, creditsData } = await fetchMovieDataAndCredits(movie.id)
        return { movie, movieData, creditsData }
      } catch {
        return null
      }
    })
  )

  const eligibleMovies = entries
    .filter(Boolean)
    .filter(({ movieData, creditsData }) =>
      isReleaseDateWithinExplorerWindow(movieData?.release_date) &&
      isPlayableMovieForGame(movieData, creditsData, gameRoundModes.CLASSIC, { ignoreReleaseWindow: true })
    )
    .map(({ movie }) => movie)

  return {
    movies: eligibleMovies.map((movie) => mapMovieSummary(movie, genreMap)),
    page: sanitizedPage,
    totalPages: Math.max(1, Math.min(500, Number(discoverData.total_pages) || 1)),
    totalResults: Number(discoverData.total_results) || eligibleMovies.length
  }
}

export async function fetchMovieSuggestions(query, { gameMode = gameRoundModes.CLASSIC } = {}) {
  const data = await fetchJson("/search/movie", {
    language: "fr-FR",
    query
  })

  return (data.results || [])
    .filter((movie) => isReleaseDateInGameWindow(movie.release_date, gameMode))
    .slice(0, 5)
    .map((movie) => ({
    id: movie.id,
    title: movie.title,
    originalTitle: movie.original_title,
    showOriginal:
      movie.original_language !== "fr" &&
      movie.original_title &&
      movie.original_title !== movie.title
    }))
}

export async function fetchRandomRoundMovie({
  minYear = 1960,
  maxYear = new Date().getFullYear(),
  maxAttempts = 5,
  gameMode = gameRoundModes.CLASSIC
} = {}) {
  const todayIso = getTodayDateIso()
  const tomorrowIso = shiftTodayIso({ days: 1 })
  const nowPlayingMinIso = shiftTodayIso({ days: -NOW_PLAYING_WINDOW_DAYS })
  const upcomingMaxIso = shiftTodayIso({ years: UPCOMING_WINDOW_YEARS })
  const currentYear = new Date().getFullYear()

  let effectiveMinYear = Math.max(1900, Number(minYear) || 1960)
  let effectiveMaxYear = Math.max(effectiveMinYear, Number(maxYear) || currentYear)

  if (gameMode === gameRoundModes.NOW_PLAYING) {
    effectiveMinYear = currentYear - 1
    effectiveMaxYear = currentYear
  } else if (gameMode === gameRoundModes.UPCOMING) {
    effectiveMinYear = currentYear
    effectiveMaxYear = currentYear + UPCOMING_WINDOW_YEARS
  }

  let attempts = 0

  while (attempts < maxAttempts) {
    attempts += 1
    const randomYear = randomBetween(effectiveMinYear, effectiveMaxYear)
    const randomPage = randomBetween(1, 5)

    const discoverParams = {
      language: "fr-FR",
      sort_by: "popularity.desc",
      page: randomPage,
      primary_release_year: randomYear
    }

    if (gameMode === gameRoundModes.NOW_PLAYING) {
      discoverParams["primary_release_date.gte"] = nowPlayingMinIso
      discoverParams["primary_release_date.lte"] = todayIso
      discoverParams["vote_count.gte"] = 20
    } else if (gameMode === gameRoundModes.UPCOMING) {
      discoverParams["primary_release_date.gte"] = tomorrowIso
      discoverParams["primary_release_date.lte"] = upcomingMaxIso
    } else {
      discoverParams["primary_release_date.lte"] = todayIso
      discoverParams["vote_count.gte"] = 500
    }

    const discoverData = await fetchJson("/discover/movie", discoverParams)

    const movies = discoverData.results
    if (!movies?.length) continue

    const randomMovie = movies[randomBetween(0, movies.length - 1)]
    if (!randomMovie.poster_path) continue

    const { movieData, creditsData } = await fetchMovieDataAndCredits(randomMovie.id)

    if (!isPlayableMovieForGame(movieData, creditsData, gameMode)) continue

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

export async function fetchMovieDiscoveryCatalog({ pages = 5, minVoteCount = 100, minYear = 1950, maxYear = new Date().getFullYear() } = {}) {
  const todayIso = getTodayDateIso()
  const genreMap = await fetchGenreMap()
  const pageRequests = Array.from({ length: pages }, (_, index) =>
    fetchJson('/discover/movie', {
      language: 'fr-FR',
      include_adult: 'false',
      sort_by: 'popularity.desc',
      page: index + 1,
      'vote_count.gte': minVoteCount,
      'primary_release_date.gte': `${minYear}-01-01`,
      'primary_release_date.lte': `${maxYear}-12-31`,
      'release_date.lte': todayIso
    })
  )

  const pagesData = await Promise.all(pageRequests)
  const uniqueMovies = Array.from(
    new Map(
      pagesData
        .flatMap((page) => page.results || [])
        .filter((movie) => movie.poster_path)
        .map((movie) => [movie.id, movie])
    ).values()
  )

  return uniqueMovies.map((movie) => mapMovieSummary(movie, genreMap))
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
      releaseDate: movieData.release_date || "",
      year: movieData.release_date?.slice(0, 4) || "",
      genres: (movieData.genres || []).map((genre) => genre.name),
      title: movieData.title || "",
      originalTitle:
        movieData.original_language !== "fr" && movieData.original_title !== movieData.title
          ? movieData.original_title
          : "",
      director: allDirectors.length > 0 ? allDirectors.map((person) => person.name).join(", ") : "Inconnu",
      directors: allDirectors.map((person) => person.name),
      actors: allActors,
      synopsis: movieData.overview || "Aucun synopsis disponible",
      runtime: movieData.runtime || 0,
      rating: movieData.vote_average || 0,
      countries: (movieData.production_countries || [])
        .map((country) => toFrenchCountryName(country.iso_3166_1, country.name))
        .filter(Boolean),
      language: movieData.original_language || "",
      budget: movieData.budget || 0,
      revenue: movieData.revenue || 0
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des détails du film:", error)
    return null
  }
}
