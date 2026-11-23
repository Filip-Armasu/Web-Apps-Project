
import { movieCards } from '../data/movieCards'
import Navbar from '../components/Navbar'
import './CollectionPage.css'

function CollectionPage({
  collection,
  onDiscover,
  onWatchlist,
  onRemove,
  onLogout,
}) {
  const watchedMovies = movieCards.filter((movie) =>
    collection.includes(movie.id)
  )

  return (
    <>
      <Navbar
        activePage="collection"
        onDiscover={onDiscover}
        onWatchlist={onWatchlist}
        onLogout={onLogout}
      />

      <main className="collection">
        <div className="collection__heading">
          <div>
            <p className="collection__eyebrow">YOUR MOVIE JOURNEY</p>
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

        {watchedMovies.length === 0 ? (
          <div className="collection__empty">
            <h2>Your collection is empty</h2>
            <p>
              Mark movies as watched to start building your collection.
            </p>
            <button type="button" onClick={onWatchlist}>
              Go to Watchlist
            </button>
          </div>
        ) : (
          <div className="collection__grid">
            {watchedMovies.map((movie) => (
              <article className="collection__card" key={movie.id}>
                <div className="collection__poster-wrapper">
                  <img
                    src={movie.poster}
                    alt={`${movie.title} poster`}
                  />
                  <span className="collection__watched-badge">
                    ✓ Watched
                  </span>
                </div>

                <div className="collection__info">
                  <h3>{movie.title}</h3>
                  <button
                    type="button"
                    onClick={() => onRemove(movie.id)}
                  >
                    Remove from Collection
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

export default CollectionPage
