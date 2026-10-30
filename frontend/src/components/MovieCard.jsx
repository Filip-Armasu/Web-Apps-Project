import './MovieCard.css'

function MovieCard({ movie, featured = false }) {
  const hasPoster = Boolean(movie.poster)

  return (
    <article
      className={`movie-card movie-card--${movie.theme} ${
        featured ? 'movie-card--featured' : ''
      }`}
    >
      {hasPoster ? (
        <img
          className="movie-card__image"
          src={movie.poster}
          alt={`${movie.title} poster`}
        />
      ) : (
        <div className="movie-card__placeholder" aria-hidden="true">
          <span className="movie-card__glow" />
          <span className="movie-card__shape movie-card__shape--one" />
          <span className="movie-card__shape movie-card__shape--two" />
          <span className="movie-card__shape movie-card__shape--three" />
        </div>
      )}

      <div className="movie-card__overlay">
        <p className="movie-card__number">MOVIEDEX #{movie.number}</p>
        <h3 className="movie-card__title">{movie.title}</h3>
      </div>
    </article>
  )
}

export default MovieCard
