
import { useState } from 'react'
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

const movieGenres = {
  interstellar: ['Sci-Fi', 'Drama'],
  dune: ['Sci-Fi', 'Action'],
  spider: ['Action', 'Sci-Fi'],
  barbie: ['Comedy'],
  batman: ['Action', 'Drama'],
  arrival: ['Sci-Fi', 'Drama'],
  inception: ['Sci-Fi', 'Action'],
  blade: ['Sci-Fi', 'Action'],
}

function HomePage({
    watchlist,
    onToggleWatchlist,
    onDiscover,
    onWatchlist,
    onCollection,
  }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('All')

  
  

  const filteredMovies = movieCards.filter((movie) => {
    const matchesSearch = movie.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase().trim())

    const matchesGenre =
      selectedGenre === 'All' ||
      (movieGenres[movie.id] || []).includes(selectedGenre)

    return matchesSearch && matchesGenre
  })

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
            <p>Find something worth watching.</p>
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
  <img
    src={movie.poster}
    alt={`${movie.title} poster`}
    className="home__poster"
  />

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
                    {(movieGenres[movie.id] || []).join(' • ')}
                  </p>
                </div>
              </article>
            ))}
          </div>

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
