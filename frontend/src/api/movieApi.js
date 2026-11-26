import { apiRequest } from './apiClient'

// Convert backend movie data into frontend format
export function normalizeMovie(movie) {
  return {
    ...movie,

    id: movie.id,

    poster:
      movie.poster_url || '/posters/placeholder.svg',

    year: movie.release_year,

    number: String(movie.id).padStart(3, '0'),

    genre: movie.genre || '',

    description: movie.description || '',
  }
}

// Fetch movies with optional search and genre filters
export async function getMovies({
  search = '',
  genre = 'All',
  signal,
} = {}) {
  const params = new URLSearchParams()

  if (search.trim()) {
    params.set('search', search.trim())
  }

  if (genre !== 'All') {
    params.set('genre', genre)
  }

  const query = params.toString()

  const endpoint = query
    ? `/api/movies?${query}`
    : '/api/movies'

  const data = await apiRequest(endpoint, {
    signal,
  })

  return data.movies.map(normalizeMovie)
}
