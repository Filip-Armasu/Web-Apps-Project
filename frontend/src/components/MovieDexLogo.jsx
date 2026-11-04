import './MovieDexLogo.css'

function MovieDexLogo({ size = 'md' }) {
  return (
    <div className={`logo logo--${size}`}>
      <span className="logo__icon" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="24" cy="24" r="8" fill="currentColor" />
          <circle cx="24" cy="8" r="3.2" fill="currentColor" />
          <circle cx="24" cy="40" r="3.2" fill="currentColor" />
          <circle cx="8" cy="24" r="3.2" fill="currentColor" />
          <circle cx="40" cy="24" r="3.2" fill="currentColor" />
          <circle cx="12.7" cy="12.7" r="2.6" fill="currentColor" />
          <circle cx="35.3" cy="12.7" r="2.6" fill="currentColor" />
          <circle cx="12.7" cy="35.3" r="2.6" fill="currentColor" />
          <circle cx="35.3" cy="35.3" r="2.6" fill="currentColor" />
        </svg>
      </span>
      <span className="logo__text">MovieDex</span>
    </div>
  )
}

export default MovieDexLogo
