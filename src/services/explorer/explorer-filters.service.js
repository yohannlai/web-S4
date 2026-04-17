const defaultSortMode = 'popularity-desc'

export const explorerSortOptions = [
  { value: 'popularity-desc', label: 'Plus populaires' },
  { value: 'rating-desc', label: 'Meilleures notes' },
  { value: 'title-asc', label: 'Titre A-Z' },
  { value: 'title-desc', label: 'Titre Z-A' }
]

export const discoverSortByMap = {
  'popularity-desc': 'popularity.desc',
  'rating-desc': 'vote_average.desc',
  'title-asc': 'original_title.asc',
  'title-desc': 'original_title.desc'
}

function isValidSortMode(sortMode) {
  return explorerSortOptions.some((option) => option.value === sortMode)
}

export function buildExplorerRouteQuery({
  searchQuery = '',
  sortMode = defaultSortMode,
  genreFilter = 'all',
  countryFilter = 'all',
  decadeFilter = 'all',
  yearFilter = 'all',
  currentPage = 1
} = {}) {
  const query = {}

  if (searchQuery) query.q = searchQuery
  if (sortMode !== defaultSortMode) query.sort = sortMode
  if (genreFilter !== 'all') query.genre = genreFilter
  if (countryFilter !== 'all') query.country = countryFilter
  if (decadeFilter !== 'all') query.decade = decadeFilter
  if (yearFilter !== 'all') query.year = yearFilter
  if (Number(currentPage) > 1) query.page = String(currentPage)

  return query
}

export function hydrateExplorerFiltersFromRoute(routeQuery = {}) {
  const querySearch = typeof routeQuery.q === 'string' ? routeQuery.q : ''
  const routeSort = typeof routeQuery.sort === 'string' ? routeQuery.sort : defaultSortMode

  return {
    searchQuery: querySearch,
    appliedSearchQuery: querySearch,
    sortMode: isValidSortMode(routeSort) ? routeSort : defaultSortMode,
    genreFilter: typeof routeQuery.genre === 'string' ? routeQuery.genre : 'all',
    countryFilter: typeof routeQuery.country === 'string' ? routeQuery.country : 'all',
    decadeFilter: typeof routeQuery.decade === 'string' ? routeQuery.decade : 'all',
    yearFilter: typeof routeQuery.year === 'string' ? routeQuery.year : 'all',
    currentPage: Math.max(1, Number(routeQuery.page) || 1)
  }
}
