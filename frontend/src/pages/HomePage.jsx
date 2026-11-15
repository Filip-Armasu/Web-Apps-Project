
import { useEffect, useState } from 'react';
import { movieCards } from '../data/movieCards'
import './HomePage.css'
import Navbar from '../components/Navbar'

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
    watchlist,
    onToggleWatchlist,
    onDiscover,
    onWatchlist,
    onCollection,
  }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [selectedMovie, setSelectedMovie] = useState(null);
  
  useEffect(() => {
    if (!selectedMovie) return;
  
    // Save the previous scroll setting
    const previousOverflow = document.body.style.overflow;
  
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
  
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedMovie(null);
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
  
    return () => {
      // Restore scrolling when the modal closes
      document.body.style.overflow = previousOverflow;
  
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedMovie]);
  
  const filteredMovies = movieCards.filter((movie) => {
    // Search movies by title
    const matchesSearch = movie.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase().trim());
  
    // Get genres directly from movieCards.js
    const movieGenreList = (movie.genre || '')
      .split('/')
      .map((genre) => genre.trim());
  
    // Check selected genre
    const matchesGenre =
      selectedGenre === 'All' ||
      movieGenreList.includes(selectedGenre);
  
    return matchesSearch && matchesGenre;
  });
 

  return (
    <main className="home">
     <Navbar
  activePage="home"
  onDiscover={onDiscover}
  onWatchlist={onWatchlist}
  onCollection={onCollection}
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

          <div className="home__movie-grid">
            {filteredMovies.map((movie) => (
              <article className="home__movie-card" key={movie.id}>
                
                <div className="home__poster-wrapper">
  <button
    type="button"
    className="home__poster-button"
    onClick={() => setSelectedMovie(movie)}
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
    className="movie-modal-overlay"
    onClick={() => setSelectedMovie(null)}
  >
    <div
      className="movie-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`${selectedMovie.title} details`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="movie-modal__close"
        onClick={() => setSelectedMovie(null)}
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
    >
      {watchlist.includes(selectedMovie.id)
        ? '✓ Remove from Watchlist'
        : '+ Add to Watchlist'}
    </button>
  </div>
</div>
      </div>
    </div>
  </div>
)}


          {filteredMovies.length === 0 && (
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
