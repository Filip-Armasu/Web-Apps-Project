import { useEffect, useRef, useState } from 'react'
import { createReview, updateReview } from '../api/reviewApi'
import './ReviewModal.css'

const ratingLabels = [
  '',
  'Poor',
  'Fair',
  'Good',
  'Great',
  'Excellent',
]

function ReviewModal({
  movie,
  review = null,
  onClose,
  onSaved,
  onSessionExpired,
}) {
  const isEditing = review !== null

  const [rating, setRating] = useState(review?.rating ?? 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState(review?.comment ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submittingRef = useRef(false)

  const displayRating = hoverRating || rating

  // Prevent background scrolling and support Escape
  useEffect(() => {
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (
        event.key === 'Escape' &&
        !submittingRef.current
      ) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow

      document.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [onClose])

  // Create or update a review
  async function handleSubmit(event) {
    event.preventDefault()

    if (submittingRef.current) return

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5.')
      return
    }

    if (comment.length > 1000) {
      setError('Your review cannot exceed 1000 characters.')
      return
    }

    submittingRef.current = true
    setIsSubmitting(true)
    setError('')

    let savedReview

    try {
      if (isEditing) {
        savedReview = await updateReview(
          review.id,
          rating,
          comment.trim()
        )
      } else {
        savedReview = await createReview(
          movie.id,
          rating,
          comment.trim()
        )
      }
    } catch (error) {
      if (error.status === 401) {
        onSessionExpired?.()
      } else {
        setError(error.message)
      }

      return
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }

    onSaved(savedReview)
  }

  return (
    <div
      className="review-modal__overlay"
      onClick={(event) => {
        if (
          event.target === event.currentTarget &&
          !submittingRef.current
        ) {
          onClose()
        }
      }}
    >
      <section
        className="review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
      >
        {/* Header */}
        <div className="review-modal__header">
          <div>
            <p className="review-modal__eyebrow">
              MOVIEDEX / MY COLLECTION
            </p>

            <h2 id="review-modal-title">
              {isEditing
                ? 'Edit Your Review'
                : 'Write a Review'}
            </h2>
          </div>

          <button
            type="button"
            className="review-modal__close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close review dialog"
            autoFocus
          >
            ×
          </button>
        </div>

        {/* Movie information */}
        <div className="review-modal__movie">
          <img
            src={movie.poster}
            alt={`${movie.title} poster`}
            className="review-modal__poster"
          />

          <div>
            <h3>{movie.title}</h3>

            <p>
              {[movie.year, movie.genre]
                .filter(Boolean)
                .join(' · ')}
            </p>

            <span className="review-modal__watched">
              ✓ Watched
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Star rating */}
          <div className="review-modal__rating-section">
            <p className="review-modal__label">
              Your Rating
            </p>

            <div
              className="review-modal__stars"
              role="group"
              aria-label="Movie rating"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`review-modal__star ${
                    star <= displayRating
                      ? 'review-modal__star--active'
                      : ''
                  }`}
                  onMouseEnter={() => setHoverRating(star)}
                  onClick={() => {
                    setRating(star)
                    setError('')
                  }}
                  disabled={isSubmitting}
                  aria-label={`Rate ${star} out of 5`}
                  aria-pressed={rating === star}
                >
                  {star <= displayRating ? '★' : '☆'}
                </button>
              ))}
            </div>

            <p className="review-modal__rating-text">
              {displayRating > 0
                ? `${displayRating} / 5 · ${
                    ratingLabels[displayRating]
                  }`
                : 'Select your rating'}
            </p>
          </div>

          {/* Review comment */}
          <div className="review-modal__comment-section">
            <label
              htmlFor="review-comment"
              className="review-modal__label"
            >
              Your Review
              <span> (Optional)</span>
            </label>

            <textarea
              id="review-comment"
              className="review-modal__textarea"
              placeholder="What did you think about this movie?"
              value={comment}
              onChange={(event) =>
                setComment(event.target.value)
              }
              maxLength={1000}
              rows={5}
              disabled={isSubmitting}
            />

            <p className="review-modal__counter">
              {comment.length} / 1000
            </p>
          </div>

          {/* API error */}
          {error && (
            <p
              className="review-modal__error"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* Action buttons */}
          <div className="review-modal__actions">
            <button
              type="button"
              className="review-modal__cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="review-modal__submit"
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting
                ? 'Saving...'
                : isEditing
                  ? 'Save Changes'
                  : 'Submit Review'}
            </button>
          </div>

        </form>
      </section>
    </div>
  )
}

export default ReviewModal
