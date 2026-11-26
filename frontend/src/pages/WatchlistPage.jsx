

import './WatchlistPage.css'
import Navbar from '../components/Navbar'

function WatchlistPage({
  watchlist,
  isUpdating,
  onRemove,
  onMarkWatched,
  onDiscover,
  onCollection,
  onLogout,
}) {
  const savedMovies = watchlist


  return (
    <>
      <Navbar
        activePage="watchlist"
        onDiscover={onDiscover}
        onCollection={onCollection}
        onLogout={onLogout}
      />

      <main className="watchlist">
      <header className="watchlist__header">
        <h1>My Watchlist</h1>
        <button type="button" onClick={onDiscover}>
          ← Back to Discover
        </button>
      </header>

      <p className="watchlist__description">
        Movies you want to watch next.
      </p>

      {savedMovies.length === 0 ? (
        <div className="watchlist__empty">
          <h2>Your watchlist is empty</h2>
          <p>Discover movies and save them here.</p>
          <button type="button" onClick={onDiscover}>
            Explore Movies
          </button>
        </div>
      ) : (
        <div className="watchlist__grid">
          {savedMovies.map((movie) => (
            <article className="watchlist__card" key={movie.id}>
              <img src={movie.poster} alt={`${movie.title} poster`} />

              <div className="watchlist__info">
                <h3>{movie.title}</h3>

                <div className="watchlist__actions">

                <button
  type="button"
  className="watchlist__watched"
  onClick={() => onMarkWatched(movie.id)}
  disabled={isUpdating}
>
  {isUpdating ? 'Updating...' : '✓ Mark as Watched'}
</button>

<button
  type="button"
  className="watchlist__remove"
  onClick={() => onRemove(movie.id)}
  disabled={isUpdating}
>
  Remove
</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
    </>
  )
}

export default WatchlistPage
