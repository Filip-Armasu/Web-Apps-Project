import { useState } from 'react'
import './ReviewFolder.css'

function ReviewFolder({
  movie,
  reviews = [],
  isLoading = false,
  error = '',
  userId,
  onClose,
  onRetry,
  onDeleteReview,
  deletingReviewId = null,
}) {
  const [sortBy, setSortBy] = useState('newest')

  // Calculate the average rating
  const reviewCount = reviews.length

  const averageRating = reviewCount
    ? reviews.reduce(
        (sum, review) => sum + Number(review.rating),
        0
      ) / reviewCount
    : 0

  // Calculate the rating distribution
  const distribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter(
      (review) => Number(review.rating) === rating
    ).length

    return {
      rating,
      count,
      percentage: reviewCount
        ? (count / reviewCount) * 100
        : 0,
    }
  })

  // Sort reviews without modifying the original array
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'highest') {
      return b.rating - a.rating || b.id - a.id
    }

    if (sortBy === 'lowest') {
      return a.rating - b.rating || b.id - a.id
    }

    return b.id - a.id
  })

  return (
    <section
      className="review-folder"
      aria-label={`${movie.title} community reviews`}
    >
      {/* Archive header */}
      <header className="review-folder__header">
        <span>COMMUNITY ARCHIVE</span>

        <span
          className="review-folder__sparkle"
          aria-hidden="true"
        >
          ✦
        </span>
      </header>

      <div className="review-folder__entry">
        DEX ENTRY #{movie.number}
      </div>

      <div className="review-folder__title">
        {movie.title}
      </div>

      <div className="review-folder__divider" />

      {/* Loading and error states */}
      {isLoading ? (
        <div
          className="review-folder__status"
          role="status"
        >
          Accessing community records...
        </div>
      ) : error ? (
        <div
          className="review-folder__status"
          role="alert"
        >
          <p>{error}</p>

          {onRetry && (
            <button
              type="button"
              className="review-folder__retry"
              onClick={onRetry}
            >
              Retry
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Average rating */}
          <div className="review-folder__summary">
            <div className="review-folder__average">
              {reviewCount
                ? averageRating.toFixed(1)
                : '—'}
            </div>

            <div>
              <div
                className="review-folder__stars"
                aria-label={
                  reviewCount
                    ? `${averageRating.toFixed(1)} out of 5`
                    : 'Not rated yet'
                }
              >
                <span aria-hidden="true">
                  {'★'.repeat(Math.round(averageRating))}
                  {'☆'.repeat(
                    5 - Math.round(averageRating)
                  )}
                </span>
              </div>

              <div className="review-folder__count">
                {reviewCount} community{' '}
                {reviewCount === 1 ? 'review' : 'reviews'}
              </div>
            </div>
          </div>

          {/* Rating distribution */}
          <div className="review-folder__distribution">
            {distribution.map((item) => (
              <div
                className="review-folder__rating-row"
                key={item.rating}
              >
                <span className="review-folder__rating-label">
                  {item.rating} ★
                </span>

                <div
                  className="review-folder__rating-track"
                  role="img"
                  aria-label={`${item.rating} stars: ${item.count} reviews`}
                >
                  <div
                    className="review-folder__rating-fill"
                    style={{
                      width: `${item.percentage}%`,
                    }}
                  />
                </div>

                <span className="review-folder__rating-count">
                  {item.count}
                </span>
              </div>
            ))}
          </div>

          <div className="review-folder__divider" />

          {/* Review sorting */}
          <div className="review-folder__list-header">
            <span>COMMUNITY RECORDS</span>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value)
              }
              aria-label="Sort reviews"
            >
              <option value="newest">Newest</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
          </div>

          {/* Scrollable review list */}
          <div className="review-folder__list">
            {reviewCount === 0 ? (
              <div className="review-folder__empty">
                <span aria-hidden="true">◇</span>
                <h3>No reviews yet</h3>
                <p>No community records found.</p>
              </div>
            ) : (
              sortedReviews.map((review) => {
                const isMine =
                  userId != null &&
                  review.user_id === userId

                const username =
                  review.username || 'MovieDex User'

                return (
                  <article
                    className="review-folder__record"
                    key={review.id}
                  >
                    <div className="review-folder__record-header">
                      <div
                        className="review-folder__avatar"
                        aria-hidden="true"
                      >
                        {username.charAt(0).toUpperCase()}
                      </div>

                      <div className="review-folder__author">
                        <strong>{username}</strong>

                        {isMine && (
                          <span className="review-folder__mine">
                            MY REVIEW
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className="review-folder__record-stars"
                      aria-label={`${review.rating} out of 5`}
                    >
                      <span aria-hidden="true">
                        {'★'.repeat(Number(review.rating))}
                        {'☆'.repeat(
                          5 - Number(review.rating)
                        )}
                      </span>
                    </div>

                    <p className="review-folder__comment">
                      {review.comment ||
                        'No written comment.'}
                    </p>

                    {isMine && onDeleteReview && (
                      <button
                        type="button"
                        className="review-folder__delete"
                        disabled={deletingReviewId !== null}
                        onClick={() =>
                          onDeleteReview(review.id)
                        }
                      >
                        {deletingReviewId === review.id
                          ? 'Deleting...'
                          : 'Delete Review'}
                      </button>
                    )}
                  </article>
                )
              })
            )}

            <div className="review-folder__end">
              — END OF ARCHIVE —
            </div>
          </div>
        </>
      )}

      {/* Close folder */}
      <button
        type="button"
        className="review-folder__close"
        onClick={onClose}
      >
        « CLOSE ARCHIVE
      </button>
    </section>
  )
}

export default ReviewFolder
