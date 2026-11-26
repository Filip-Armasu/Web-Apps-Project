import { apiRequest } from './apiClient'
import { normalizeMovie } from './movieApi'

// READ: Get the current user's movies
export async function getUserMovies(status, signal) {
  const endpoint = status
    ? `/api/watchlist?status=${encodeURIComponent(status)}`
    : '/api/watchlist'

  const data = await apiRequest(endpoint, {
    signal,
  })

  return data.items.map(normalizeMovie)
}

// CREATE: Add a movie to the user's watchlist
export async function addToWatchlist(movieId) {
  return apiRequest('/api/watchlist', {
    method: 'POST',

    body: JSON.stringify({
      movie_id: movieId,
      status: 'watchlist',
    }),
  })
}

// UPDATE: Change a movie's status
export async function updateMovieStatus(
  movieId,
  status
) {
  return apiRequest(`/api/watchlist/${movieId}`, {
    method: 'PATCH',

    body: JSON.stringify({
      status,
    }),
  })
}

// DELETE: Remove a movie from the user's list
export async function removeUserMovie(movieId) {
  return apiRequest(`/api/watchlist/${movieId}`, {
    method: 'DELETE',
  })
}
