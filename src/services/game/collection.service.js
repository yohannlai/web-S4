const collectionStorageKey = 'cinelogique_movie_collection_v1'

function emptyCollection() {
  return {
    seen: [],
    found: [],
    watchlist: []
  }
}

function normalizeCollectionEntry(movie) {
  return {
    movieId: movie.movieId,
    title: movie.title || '',
    originalTitle: movie.originalTitle || '',
    posterUrl: movie.posterUrl || '',
    year: movie.year || '',
    savedAt: new Date().toISOString()
  }
}

function notifyCollectionUpdated() {
  window.dispatchEvent(new CustomEvent('cine:collection-updated'))
}

function readRawCollection() {
  try {
    const raw = localStorage.getItem(collectionStorageKey)
    if (!raw) return emptyCollection()

    const parsed = JSON.parse(raw)
    return {
      seen: Array.isArray(parsed.seen) ? parsed.seen : [],
      found: Array.isArray(parsed.found) ? parsed.found : [],
      watchlist: Array.isArray(parsed.watchlist) ? parsed.watchlist : []
    }
  } catch (error) {
    console.error('Erreur de lecture de la collection:', error)
    return emptyCollection()
  }
}

function writeRawCollection(collection) {
  localStorage.setItem(collectionStorageKey, JSON.stringify(collection))
  notifyCollectionUpdated()
}

function upsertMovie(list, movie) {
  const filtered = list.filter((entry) => entry.movieId !== movie.movieId)
  filtered.unshift(normalizeCollectionEntry(movie))
  return filtered
}

function removeMovie(list, movieId) {
  return list.filter((entry) => entry.movieId !== movieId)
}

export function getMovieCollection() {
  return readRawCollection()
}

export function isMovieInSeenCollection(movieId) {
  const collection = readRawCollection()
  return collection.seen.some((movie) => movie.movieId === movieId)
}

export function toggleSeenMovie(movie) {
  const collection = readRawCollection()
  const alreadySeen = collection.seen.some((entry) => entry.movieId === movie.movieId)

  if (alreadySeen) {
    collection.seen = collection.seen.filter((entry) => entry.movieId !== movie.movieId)
    writeRawCollection(collection)
    return false
  }

  collection.seen = upsertMovie(collection.seen, movie)
  writeRawCollection(collection)
  return true
}

export function addFoundMovie(movie) {
  const collection = readRawCollection()
  collection.found = upsertMovie(collection.found, movie)
  writeRawCollection(collection)
}

export function removeMovieFromCollectionList(listName, movieId) {
  const collection = readRawCollection()

  if (!['seen', 'found', 'watchlist'].includes(listName)) return collection

  collection[listName] = removeMovie(collection[listName], movieId)
  writeRawCollection(collection)
  return collection
}

export function removeSeenMovie(movieId) {
  return removeMovieFromCollectionList('seen', movieId)
}

export function removeFoundMovie(movieId) {
  return removeMovieFromCollectionList('found', movieId)
}

export function removeWatchlistMovie(movieId) {
  return removeMovieFromCollectionList('watchlist', movieId)
}
