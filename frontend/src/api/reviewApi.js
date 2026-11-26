import { apiRequest } from './apiClient'

// 1. Get all reviews for a movie
export async function getMovieReviews(movieId, signal) {
  const data = await apiRequest(
    `/api/movies/${movieId}/reviews`,
    { signal }
  )

  return data.reviews
}

// 2. Create a new review
export async function createReview(
  movieId,
  rating,
  comment
) {
  const data = await apiRequest(
    `/api/movies/${movieId}/reviews`,
    {
      method: 'POST',
      body: JSON.stringify({
        rating,
        comment,
      }),
    }
  )

  return data.review
}

// 3. Update an existing review
export async function updateReview(
  reviewId,
  rating,
  comment
) {
  const data = await apiRequest(
    `/api/reviews/${reviewId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        rating,
        comment,
      }),
    }
  )

  return data.review
}

// 4. Delete a review
export async function deleteReview(reviewId) {
  return apiRequest(
    `/api/reviews/${reviewId}`,
    {
      method: 'DELETE',
    }
  )
}
