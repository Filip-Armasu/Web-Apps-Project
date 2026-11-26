import { useEffect, useRef, useState } from 'react'

import Navbar from '../components/Navbar'
import ReviewModal from '../components/ReviewModal'

import {
  getMovieReviews,
  deleteReview,
} from '../api/reviewApi'

import './CollectionPage.css'

function CollectionPage({
  collection,
  userId,
  isUpdating,
  onDiscover,
  onWatchlist,
  onRemove,
  onLogout,
  onSessionExpired,
}) {
  const watchedMovies = collection

  // Review states
  const [myReviews, setMyReviews] = useState({})
  // Collection sorting state
const [sortBy, setSortBy] = useState('recent')
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [reviewError, setReviewError] = useState('')
  const [activeModal, setActiveModal] = useState(null)
  const [deletingReviewId, setDeletingReviewId] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const deletingRef = useRef(false)
  const mountedRef = useRef(false)

  // Only reload when the movie IDs change
  const movieIdsKey = watchedMovies
    .map((movie) => movie.id)
    .join(',')

  const isBusy =
    isUpdating ||
    deletingReviewId !== null ||
    activeModal !== null

  // Track whether the page is still mounted
  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  // Load the current user's reviews
  useEffect(() => {
    const controller = new AbortController()

    async function loadReviews() {
      setIsLoadingReviews(true)
      setReviewError('')
      setMyReviews({})

      try {
        const movieIds = movieIdsKey
          ? movieIdsKey.split(',').map(Number)
          : []

        const results = await Promise.all(
          movieIds.map(async (movieId) => {
            const reviews = await getMovieReviews(
              movieId,
              controller.signal
            )

            const ownReview = reviews.find(
              (review) => review.user_id === userId
            )

            return [movieId, ownReview || null]
          })
        )

        if (!controller.signal.aborted) {
          setMyReviews(Object.fromEntries(results))
        }

      } catch (error) {
        if (controller.signal.aborted) return

        if (error.status === 401) {
          onSessionExpired()
        } else {
          setReviewError(
            'Unable to load your reviews. Please try again.'
          )
        }

      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingReviews(false)
        }
      }
    }

    loadReviews()

    return () => controller.abort()

  }, [movieIdsKey, userId, reloadKey, onSessionExpired])

  // Open the create review modal
  function handleWriteReview(movie) {
    if (isBusy || isLoadingReviews || reviewError) return

    setActiveModal({
      movie,
      review: null,
    })
  }

  // Open the edit review modal
  function handleEditReview(movie, review) {
    if (isBusy || isLoadingReviews || reviewError) return

    setActiveModal({
      movie,
      review,
    })
  }

  // Update the UI after creating or editing a review
  function handleReviewSaved(savedReview) {
    if (!activeModal) return

    const movieId = activeModal.movie.id

    setMyReviews((previous) => ({
      ...previous,
      [movieId]: savedReview,
    }))

    setActiveModal(null)
    setReviewError('')
  }

  // Delete the current user's review
  async function handleDeleteReview(movie, review) {
    if (
      isBusy ||
      deletingRef.current ||
      isLoadingReviews ||
      reviewError
    ) {
      return
    }

    const confirmed = window.confirm(
      `Delete your review for "${movie.title}"?`
    )

    if (!confirmed) return

    deletingRef.current = true
    setDeletingReviewId(review.id)
    setReviewError('')

    try {
      await deleteReview(review.id)

      if (!mountedRef.current) return

      setMyReviews((previous) => ({
        ...previous,
        [movie.id]: null,
      }))

    } catch (error) {
      if (!mountedRef.current) return

      if (error.status === 401) {
        onSessionExpired()
      } else {
        setReviewError(error.message)
      }

    } finally {
      deletingRef.current = false

      if (mountedRef.current) {
        setDeletingReviewId(null)
      }
    }
  }

  // Sort collection movies
const sortedMovies = [...watchedMovies].sort((a, b) => {

  // Default sorting: most recently added
  const compareRecent = () => {
    const dateA = String(a.created_at || '')
    const dateB = String(b.created_at || '')

    return (
      dateB.localeCompare(dateA) ||
      Number(b.entry_id || 0) - Number(a.entry_id || 0)
    )
  }

  // Sort by title
  if (sortBy === 'az') {
    return a.title.localeCompare(b.title)
  }

  // Sort by oldest added date
  if (sortBy === 'oldest') {
    return -compareRecent()
  }

  // Sort by personal rating
  if (sortBy === 'highest' || sortBy === 'lowest') {

    // Use date sorting while reviews are unavailable
    if (isLoadingReviews || reviewError) {
      return compareRecent()
    }

    const ratingA = myReviews[a.id]?.rating
    const ratingB = myReviews[b.id]?.rating

    // Unrated movies always appear at the bottom
    if (ratingA == null && ratingB == null) {
      return compareRecent()
    }

    if (ratingA == null) return 1
    if (ratingB == null) return -1

    // Highest rated first
    if (sortBy === 'highest') {
      return ratingB - ratingA || compareRecent()
    }

    // Lowest rated first
    return ratingA - ratingB || compareRecent()
  }

  return compareRecent()
})


  // Remove a watched movie from the collection
  function handleRemoveMovie(movie) {
    if (isBusy) return

    const message = myReviews[movie.id]
      ? `Remove "${movie.title}" from your collection? Your review will remain public.`
      : `Remove "${movie.title}" from your collection?`

    if (window.confirm(message)) {
      onRemove(movie.id)
    }
  }

  return (
    <>
      <Navbar
        activePage="collection"
        onDiscover={onDiscover}
        onWatchlist={onWatchlist}
        onLogout={onLogout}
      />

      <main className="collection">

        {/* Page heading */}
        <div className="collection__heading">
          <div>
            <p className="collection__eyebrow">
              YOUR MOVIE JOURNEY
            </p>

            <h1>My Collection</h1>

            <p className="collection__description">
              Every movie you've watched, all in one place.
            </p>
          </div>

          <div className="collection__count">
            <strong>{watchedMovies.length}</strong>
            <span>Movies Watched</span>
          </div>
        </div>

{/* Collection sorting toolbar */}
{watchedMovies.length > 0 && (
  <div className="collection__toolbar">

    <div className="collection__toolbar-info">
      <span className="collection__toolbar-icon">
        ◈
      </span>

      <span>PERSONAL ARCHIVE</span>
    </div>

    <div className="collection__sort-control">

      <label htmlFor="collection-sort">
        SORT BY
      </label>

      <select
        id="collection-sort"
        value={sortBy}
        onChange={(event) =>
          setSortBy(event.target.value)
        }
      >
        <option value="recent">
          Recently Added
        </option>

        <option value="oldest">
          Oldest Added
        </option>

        <option
          value="highest"
          disabled={isLoadingReviews || Boolean(reviewError)}
        >
          Highest Rated
        </option>

        <option
          value="lowest"
          disabled={isLoadingReviews || Boolean(reviewError)}
        >
          Lowest Rated
        </option>

        <option value="az">
          Title A–Z
        </option>
      </select>

    </div>
  </div>
)}

        {/* Review loading message */}
        {isLoadingReviews && watchedMovies.length > 0 && (
          <p
            className="collection__review-loading"
            role="status"
          >
            Loading your reviews...
          </p>
        )}

        {/* Review error message */}
        {reviewError && (
          <div
            className="collection__review-error"
            role="alert"
          >
            <p>{reviewError}</p>

            <button
              type="button"
              disabled={isBusy || isLoadingReviews}
              onClick={() =>
                setReloadKey((previous) => previous + 1)
              }
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty collection */}
        {watchedMovies.length === 0 ? (
          <div className="collection__empty">
            <h2>Your collection is empty</h2>

            <p>
              Mark movies as watched to start building
              your collection.
            </p>

            <button
              type="button"
              onClick={onWatchlist}
            >
              Go to Watchlist
            </button>
          </div>
        ) : (

          /* Watched movie grid */
          <div className="collection__grid">

{sortedMovies.map((movie) => {
              const review = myReviews[movie.id]

              const reviewReady =
                !isLoadingReviews && !reviewError

              return (
                <article
                  className="collection__card"
                  key={movie.id}
                >
                  {/* Movie poster */}
                  <div className="collection__poster-wrapper">
                    <img
                      src={movie.poster}
                      alt={`${movie.title} poster`}
                    />

                    <span className="collection__watched-badge">
                      ✓ Watched
                    </span>
                  </div>

                  {/* Movie information */}
                  <div className="collection__info">

                    <h3>{movie.title}</h3>

                    <p className="collection__movie-meta">
                      {[movie.year, movie.genre]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>

                    {/* Personal review */}
                    <div className="collection__review">

                      <p className="collection__review-label">
                        MY REVIEW
                      </p>

                      {!reviewReady ? (
                        <p className="collection__review-empty">
                          {isLoadingReviews
                            ? 'Loading review...'
                            : 'Review unavailable.'}
                        </p>
                      ) : review ? (
                        <>
                          {/* Existing star rating */}
                          <div className="collection__rating">

                            <span
                              className="collection__stars"
                              aria-label={`${review.rating} out of 5 stars`}
                            >
                              {'★'.repeat(review.rating)}
                              <span className="collection__stars-empty">
                                {'☆'.repeat(5 - review.rating)}
                              </span>
                            </span>

                            <span className="collection__rating-number">
                              {review.rating}/5
                            </span>

                          </div>

                          {/* Existing review comment */}
                          <p className="collection__review-comment">
                            {review.comment ||
                              'Rated without a written review.'}
                          </p>

                          {/* Edit and delete buttons */}
                          <div className="collection__review-actions">

                            <button
                              type="button"
                              className="collection__edit-review"
                              disabled={isBusy}
                              onClick={() =>
                                handleEditReview(movie, review)
                              }
                            >
                              Edit Review
                            </button>

                            <button
                              type="button"
                              className="collection__delete-review"
                              disabled={isBusy}
                              onClick={() =>
                                handleDeleteReview(movie, review)
                              }
                            >
                              {deletingReviewId === review.id
                                ? 'Deleting...'
                                : 'Delete Review'}
                            </button>

                          </div>
                        </>
                      ) : (
                        <>
                          {/* Movie without a review */}
                          <div className="collection__stars-empty">
                            ☆☆☆☆☆
                          </div>

                          <p className="collection__review-empty">
                            You haven't reviewed this movie yet.
                          </p>

                          <button
                            type="button"
                            className="collection__write-review"
                            disabled={isBusy}
                            onClick={() =>
                              handleWriteReview(movie)
                            }
                          >
                            + Write a Review
                          </button>
                        </>
                      )}
                    </div>

                    {/* Remove from collection */}
                    <button
                      type="button"
                      className="collection__remove-button"
                      onClick={() =>
                        handleRemoveMovie(movie)
                      }
                      disabled={
                        isBusy ||
                        isLoadingReviews ||
                        Boolean(reviewError)
                      }
                    >
                      Remove from Collection
                    </button>

                  </div>
                </article>
              )
            })}

          </div>
        )}
      </main>

      {/* Create / Edit Review Modal */}
      {activeModal && (
        <ReviewModal
          movie={activeModal.movie}
          review={activeModal.review}
          onClose={() => setActiveModal(null)}
          onSaved={handleReviewSaved}
          onSessionExpired={onSessionExpired}
        />
      )}
    </>
  )
}

export default CollectionPage
