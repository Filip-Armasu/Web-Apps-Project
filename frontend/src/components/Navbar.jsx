
import MovieDexLogo from './MovieDexLogo'
import './Navbar.css'

function Navbar({
  activePage = 'home',
  onDiscover,
  onWatchlist,
  onCollection,
}) {
  return (
    <header className="home__header">
      <div className="home__nav">
        <div className="home__brand">
          <MovieDexLogo size="lg" />
        </div>

        <nav className="home__menu" aria-label="Main navigation">
          <button
            type="button"
            className={`home__menu-item ${
              activePage === 'home' ? 'home__menu-item--active' : ''
            }`}
            onClick={onDiscover}
            aria-current={activePage === 'home' ? 'page' : undefined}
          >
            Discover
          </button>

          <button
            type="button"
            className={`home__menu-item ${
              activePage === 'watchlist' ? 'home__menu-item--active' : ''
            }`}
            onClick={onWatchlist}
            aria-current={activePage === 'watchlist' ? 'page' : undefined}
          >
            Watchlist
          </button>

          <button
            type="button"
            className={`home__menu-item ${
              activePage === 'collection' ? 'home__menu-item--active' : ''
            }`}
            onClick={onCollection}
            aria-current={activePage === 'collection' ? 'page' : undefined}
          >
            Collection
          </button>
        </nav>

        <div className="home__profile">
          <span className="home__profile-avatar">👤</span>
        </div>
      </div>
    </header>
  )
}

export default Navbar
