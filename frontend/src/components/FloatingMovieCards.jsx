import { movieCards } from '../data/movieCards'
import MovieCard from './MovieCard'
import './FloatingMovieCards.css'

function findCard(id) {
  return movieCards.find((card) => card.id === id)
}

function FloatingMovieCards({ layout = 'landing' }) {
  if (layout === 'login') {
    return (
      <div className="card-stage card-stage--login" aria-hidden="true">
        <div className="card-slot card-slot--login-1">
          <MovieCard movie={findCard('spider')} />
        </div>
        <div className="card-slot card-slot--login-2">
          <MovieCard movie={findCard('interstellar')} featured />
        </div>
        <div className="card-slot card-slot--login-3">
          <MovieCard movie={findCard('dune')} />
        </div>
        <div className="card-slot card-slot--login-4">
          <MovieCard movie={findCard('barbie')} />
        </div>
        <div className="card-slot card-slot--login-5">
          <MovieCard movie={findCard('inception')} />
        </div>
        <div className="card-slot card-slot--login-6">
          <MovieCard movie={findCard('batman')} />
        </div>
      </div>
    )
  }

  return (
    <div className="card-stage card-stage--landing" aria-hidden="true">
      <div className="card-slot card-slot--l1">
        <MovieCard movie={findCard('spider')} />
      </div>
      <div className="card-slot card-slot--l2">
        <MovieCard movie={findCard('dune')} />
      </div>
      <div className="card-slot card-slot--l3">
        <MovieCard movie={findCard('arrival')} />
      </div>
      <div className="card-slot card-slot--l4">
        <MovieCard movie={findCard('barbie')} />
      </div>
      <div className="card-slot card-slot--l5">
        <MovieCard movie={findCard('inception')} />
      </div>
      <div className="card-slot card-slot--l6">
        <MovieCard movie={findCard('blade')} />
      </div>
      <div className="card-slot card-slot--l7">
        <MovieCard movie={findCard('batman')} />
      </div>
      <div className="card-slot card-slot--featured">
        <MovieCard movie={findCard('interstellar')} featured />
      </div>
    </div>
  )
}

export default FloatingMovieCards
