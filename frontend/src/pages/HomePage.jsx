
import { useEffect, useState } from 'react';
import { getMovies } from '../api/movieApi'
import {
  getMovieReviews,
  deleteReview,
} from '../api/reviewApi'
import './HomePage.css'
import Navbar from '../components/Navbar'
import ReviewFolder from '../components/ReviewFolder'

const genres = [
  'All',
  'Action',
  'Sci-Fi',
  'Romance',
  'Comedy',
  'Horror',
  'Drama',
]



function HomePage({
  userId,
  watchlist,
  collection,
  isUpdating,
  onToggleWatchlist,
  onDiscover,
  onWatchlist,
  onCollection,
  onLogout,
  onSessionExpired,

}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [selectedMovie, setSelectedMovie] = useState(null);

// Review folder state
const [isReviewFolderOpen, setIsReviewFolderOpen] =
  useState(false)

// Community review states
const [reviewData, setReviewData] = useState({
  movieId: null,
  reviews: [],
  isLoading: true,
  error: '',
})

const [reviewReloadKey, setReviewReloadKey] = useState(0)
// Track the review currently being deleted
const [deletingReviewId, setDeletingReviewId] =
  useState(null)

const selectedMovieId = selectedMovie?.id

// Prevent reviews from another movie being displayed
const isCurrentReviewData =
  reviewData.movieId === selectedMovieId

const movieReviews = isCurrentReviewData
  ? reviewData.reviews
  : []

const isLoadingReviews =
  !isCurrentReviewData || reviewData.isLoading

const reviewError = isCurrentReviewData
  ? reviewData.error
  : ''

// Calculate the average community rating
const averageRating = movieReviews.length > 0
  ? movieReviews.reduce(
      (sum, review) => sum + Number(review.rating),
      0
    ) / movieReviews.length
  : null

// Open movie details with the review folder closed
const openMovieDetails = (movie) => {
  setIsReviewFolderOpen(false)
  setSelectedMovie(movie)
}

// Close the entire movie archive
const closeMovieDetails = () => {
  setIsReviewFolderOpen(false)
  setSelectedMovie(null)
}

  const [filteredMovies, setFilteredMovies] = useState([])
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState('')


  useEffect(() => {
    if (!selectedMovie) return;

    // Save the previous scroll setting
    const previousOverflow = document.body.style.overflow;

    // Prevent background scrolling
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (isReviewFolderOpen) {
          setIsReviewFolderOpen(false)
        } else {
          closeMovieDetails()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      // Restore scrolling when the modal closes
      document.body.style.overflow = previousOverflow;

      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedMovie, isReviewFolderOpen])
  // Delete the current user's own community review
const handleDeleteCommunityReview = async (reviewId) => {

  // Prevent duplicate deletion requests
  if (deletingReviewId !== null) return

  // Find the selected review
  const targetReview = movieReviews.find(
    (review) => review.id === reviewId
  )

  // Only allow users to delete their own reviews
  if (
    !targetReview ||
    userId == null ||
    targetReview.user_id !== userId
  ) {
    return
  }

  // Ask for confirmation
  const confirmed = window.confirm(
    'Are you sure you want to delete your review? This action cannot be undone.'
  )

  if (!confirmed) return

  setDeletingReviewId(reviewId)

  try {

    // Delete the review from the backend database
    await deleteReview(reviewId)

    // Fetch updated community reviews
    setReviewReloadKey(
      (previous) => previous + 1
    )

  } catch (error) {

    // Handle expired login sessions
    if (error.status === 401) {
      onSessionExpired()
      return
    }

    // Display deletion errors
    window.alert(
      error.message || 'Unable to delete your review.'
    )

  } finally {

    setDeletingReviewId(null)

  }
}

// Fetch community reviews for the selected movie
useEffect(() => {
  if (!selectedMovieId) return

  const controller = new AbortController()

  setReviewData({
    movieId: selectedMovieId,
    reviews: [],
    isLoading: true,
    error: '',
  })

  const fetchReviews = async () => {
    try {
      const reviews = await getMovieReviews(
        selectedMovieId,
        controller.signal
      )

      if (controller.signal.aborted) return

      setReviewData({
        movieId: selectedMovieId,
        reviews,
        isLoading: false,
        error: '',
      })

    } catch (error) {
      if (controller.signal.aborted) return

      if (error.status === 401) {
        onSessionExpired()
        return
      }

      setReviewData({
        movieId: selectedMovieId,
        reviews: [],
        isLoading: false,
        error: error.message || 'Unable to load reviews.',
      })
    }
  }

  fetchReviews()

  return () => {
    controller.abort()
  }

}, [
  selectedMovieId,
  reviewReloadKey,
  onSessionExpired,
])

  // Fetch movies from the backend database
useEffect(() => {
  const controller = new AbortController()

  setIsLoading(true)
  setError('')

  const timer = setTimeout(async () => {
    try {
      const movies = await getMovies({
        search: searchQuery,
        genre: selectedGenre,
        signal: controller.signal,
      })

      if (!controller.signal.aborted) {
        setFilteredMovies(movies)
      }
    } catch (error) {
      if (controller.signal.aborted) return

      if (error.status === 401) {
        onSessionExpired()
      } else {
        setFilteredMovies([])
        setError(error.message)
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, 300)

  return () => {
    clearTimeout(timer)
    controller.abort()
  }
}, [searchQuery, selectedGenre, onSessionExpired])

  return (
    <main className="home">
     <Navbar
  activePage="home"
  onDiscover={onDiscover}
  onWatchlist={onWatchlist}
  onCollection={onCollection}
  onLogout={onLogout}
/>

      <section className="home__content">
        <div className="home__hero">
          <p className="home__eyebrow">
            YOUR MOVIE UNIVERSE STARTS HERE
          </p>

          <h1>Discover Your Next Favorite Movie</h1>

          <p className="home__description">
            Explore movies, save your favorites to your watchlist,
            and build your own MovieDex collection.
          </p>


<form
  className="home__search"
  onSubmit={(event) => event.preventDefault()}
>
  <svg
    className="home__search-svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m16 16 5 5" />
  </svg>

  <input
    type="search"
    placeholder="Search for movies (e.g., Interstellar, Batman...)"
    value={searchQuery}
    onChange={(event) => setSearchQuery(event.target.value)}
    aria-label="Search movies"
  />

  <button type="submit" className="home__search-button">
    Search
  </button>
</form>

        </div>

        <section className="home__explore">
        <div className="home__section-heading">
  <h2>Explore Movies</h2>

  <p>
    Showing {filteredMovies.length}{' '}
    {filteredMovies.length === 1 ? 'movie' : 'movies'}
  </p>
</div>

          <div className="home__genres" aria-label="Filter by genre">
            {genres.map((genre) => (
              <button
                key={genre}
                type="button"
                className={
                  selectedGenre === genre
                    ? 'home__genre home__genre--active'
                    : 'home__genre'
                }
                onClick={() => setSelectedGenre(genre)}
                aria-pressed={selectedGenre === genre}
              >
                {genre}
              </button>
            ))}
          </div>

          {isLoading && (
  <div className="home__empty" role="status">
    <h3>Loading movies...</h3>
    <p>Connecting to the MovieDex database.</p>
  </div>
)}

{error && (
  <div className="home__empty" role="alert">
    <h3>Unable to load movies</h3>
    <p>{error}</p>
  </div>
)}

          <div className="home__movie-grid">
          {!isLoading && !error && filteredMovies.map((movie) => (
              <article className="home__movie-card" key={movie.id}>

                <div className="home__poster-wrapper">
  <button
    type="button"
    className="home__poster-button"
    onClick={() => openMovieDetails(movie)}
    aria-label={`View details for ${movie.title}`}
  >
    <img
      src={movie.poster}
      alt={`${movie.title} poster`}
      className="home__poster"
    />
  </button>

  <span className="home__movie-number">
    #{movie.number}
  </span>

  <button
    type="button"
    className={`home__bookmark ${
      watchlist.includes(movie.id)
        ? 'home__bookmark--active'
        : ''
    }`}
    onClick={() => onToggleWatchlist(movie.id)}
    disabled={isUpdating || collection.includes(movie.id)}
    aria-label={
      watchlist.includes(movie.id)
        ? `Remove ${movie.title} from watchlist`
        : `Add ${movie.title} to watchlist`
    }
    aria-pressed={watchlist.includes(movie.id)}
    title={
      watchlist.includes(movie.id)
        ? 'Remove from Watchlist'
        : 'Add to Watchlist'
    }
  >
    <svg
      viewBox="0 0 24 24"
      fill={watchlist.includes(movie.id) ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.5L5 21V4.5a1 1 0 0 1 1-1Z" />
    </svg>
  </button>
</div>


                <div className="home__movie-info">
                  <h3>{movie.title}</h3>
                  <p>
                  {(movie.genre || 'Movie')
    .split('/')
    .map((genre) => genre.trim())
    .join(' • ')}
                  </p>
                </div>
              </article>
            ))}
          </div>

          {selectedMovie && (
  <div
    className={`movie-modal-overlay ${
      isReviewFolderOpen
        ? 'movie-modal-overlay--expanded'
        : ''
    }`}
    onClick={closeMovieDetails}
  >
    <div
      className={`movie-archive ${
        isReviewFolderOpen
          ? 'movie-archive--open'
          : ''
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={`${selectedMovie.title} archive`}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="movie-modal">

      <button
        type="button"
        className="movie-modal__close"
        onClick={closeMovieDetails}
        aria-label="Close movie details"
      >
        ×
      </button>

      <div className="movie-modal__card">
      <div className="movie-modal__hologram" aria-hidden="true" />
        {/* FRONT: Movie Poster */}
        <div className="movie-modal__face movie-modal__front">
          <img
            src={selectedMovie.poster}
            alt={`${selectedMovie.title} poster`}
          />
        </div>

        {/* BACK: Movie Details */}
        <div className="movie-modal__face movie-modal__back">
  {/* Card header */}
  <div className="movie-modal__header">
    <span className="movie-modal__label">
      MOVIEDEX / ARCHIVE {selectedMovie.number}
    </span>
    <span className="movie-modal__sparkle" aria-hidden="true">
      ✦
    </span>
  </div>

  {/* Poster + movie information */}
  <div className="movie-modal__overview">
    <img
      src={selectedMovie.poster}
      alt={`${selectedMovie.title} poster`}
      className="movie-modal__mini-poster"
    />

    <div className="movie-modal__info">
      <h2>{selectedMovie.title}</h2>

      <p className="movie-modal__year">
        {selectedMovie.year || 'Year unavailable'}
      </p>

      {/* Community average rating */}
<div className="movie-modal__community-rating">
  {isLoadingReviews ? (
    <span className="movie-modal__rating-muted">
      Loading rating...
    </span>
  ) : reviewError ? (
    <span className="movie-modal__rating-muted">
      Rating unavailable
    </span>
  ) : averageRating !== null ? (
    <>
      <span className="movie-modal__rating-star">
        ★
      </span>

      <strong>
        {averageRating.toFixed(1)}
      </strong>

      <span className="movie-modal__rating-count">
        / 5 ({movieReviews.length})
      </span>
    </>
  ) : (
    <span className="movie-modal__rating-muted">
      ☆ No ratings yet
    </span>
  )}
</div>

      <div className="movie-modal__genres">
  {(selectedMovie.genre || 'Movie')
    .split('/')
    .map((genre) => (
      <span
        className="movie-modal__genre-tag"
        key={genre.trim()}
      >
        {genre.trim()}
      </span>
    ))}
</div>
    </div>
  </div>

  <div className="movie-modal__divider" />

  {/* Synopsis */}
  <div className="movie-modal__story">
    <span className="movie-modal__section-label">
      SYNOPSIS / STORY
    </span>

    <p className="movie-modal__description">
      {selectedMovie.description ||
        'No description available yet.'}
    </p>
  </div>


{/* Footer */}
<div className="movie-modal__footer">
  <span className="movie-modal__footer-label">
    MOVIE ARCHIVE
  </span>

  <button
    type="button"
    className="movie-modal__watchlist"
    onClick={() => onToggleWatchlist(selectedMovie.id)}
    disabled={isUpdating || collection.includes(selectedMovie.id)}
  >
    {collection.includes(selectedMovie.id)
      ? '✓ Already Watched'
      : isUpdating
        ? 'Updating...'
        : watchlist.includes(selectedMovie.id)
          ? '✓ Remove from Watchlist'
          : '+ Add to Watchlist'}
  </button>

  {/* View Reviews button */}
  <button
  type="button"
  className={`movie-modal__reviews-button ${
    isReviewFolderOpen
      ? 'movie-modal__reviews-button--hidden'
      : ''
  }`}
  aria-expanded={isReviewFolderOpen}
  disabled={isReviewFolderOpen}
  onClick={() => setIsReviewFolderOpen(true)}
>
  VIEW REVIEWS »
</button>

</div>
{/* End of footer */}

</div>
{/* End of movie-modal__back */}

</div>
{/* End of movie-modal__card */}

</div>
{/* End of movie-modal */}

{/* Unfolding review archive */}
<div
  className="movie-archive__leaf"
  inert={!isReviewFolderOpen}
  aria-hidden={!isReviewFolderOpen}
>
<ReviewFolder
  key={selectedMovie.id}
  movie={selectedMovie}
  reviews={movieReviews}
  isLoading={isLoadingReviews}
  error={reviewError}

  userId={userId}

  onDeleteReview={handleDeleteCommunityReview}

  deletingReviewId={deletingReviewId}

  onRetry={() =>
    setReviewReloadKey((previous) => previous + 1)
  }

  onClose={() => setIsReviewFolderOpen(false)}
/>
</div>

</div>
{/* End of movie-archive */}

</div>
)}

{!isLoading && !error && filteredMovies.length === 0 && (
            <div className="home__empty">
              <h3>No movies found</h3>
              <p>Try another title or genre.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default HomePage
