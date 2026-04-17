export const competitiveConfig = {
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

export function calculateHintPenalty(revealedCards) {
  let penalty = 0
  if (revealedCards.genres) penalty += competitiveConfig.hintPenalties.genres
  if (revealedCards.year) penalty += competitiveConfig.hintPenalties.year
  if (revealedCards.director) penalty += competitiveConfig.hintPenalties.director
  if (revealedCards.actors) penalty += competitiveConfig.hintPenalties.actors
  return penalty
}

export function calculateWrongGuessPenalty(wrongGuesses) {
  return Math.min(
    wrongGuesses * competitiveConfig.wrongGuessPenalty,
    competitiveConfig.maxWrongGuessPenalty
  )
}

export function calculateTimeBonus(durationSeconds) {
  return Math.max(
    0,
    Math.floor((competitiveConfig.timeWindowSeconds - durationSeconds) / competitiveConfig.timeBonusStepSeconds)
  )
}

export function calculateStreakMultiplier(nextStreak) {
  if (nextStreak >= 5) return 1.2
  if (nextStreak >= 3) return 1.1
  return 1
}

export function createRoundHistoryEntry({
  historyLength,
  currentMovieId,
  title,
  originalTitle,
  passed,
  points = 0,
  revealedHints = 0,
  wrongGuesses = 0,
  elapsed = 0,
  streakMultiplier = 1
}) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    round: historyLength + 1,
    movieId: currentMovieId,
    title,
    originalTitle,
    passed,
    points,
    revealedHints,
    wrongGuesses,
    elapsedSeconds: elapsed,
    streakMultiplier,
    playedAt: new Date().toISOString()
  }
}

export function persistCompetitiveState({ totalScore, streak, gameHistory }) {
  const payload = {
    totalScore,
    streak,
    gameHistory
  }
  localStorage.setItem(competitiveConfig.storageKey, JSON.stringify(payload))
}

export function restoreCompetitiveState() {
  const raw = localStorage.getItem(competitiveConfig.storageKey)
  if (!raw) {
    return {
      totalScore: 0,
      streak: 0,
      gameHistory: []
    }
  }

  const parsed = JSON.parse(raw)
  return {
    totalScore: Number(parsed.totalScore) || 0,
    streak: Number(parsed.streak) || 0,
    gameHistory: Array.isArray(parsed.gameHistory) ? parsed.gameHistory : []
  }
}

export function clearCompetitiveState() {
  localStorage.removeItem(competitiveConfig.storageKey)
}
