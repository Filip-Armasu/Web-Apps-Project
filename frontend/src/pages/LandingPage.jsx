import MovieDexLogo from '../components/MovieDexLogo'
import FloatingMovieCards from '../components/FloatingMovieCards'
import './LandingPage.css'

function LandingPage({ onGetStarted }) {
  return (
    <section className="landing">
      <div className="landing__glow landing__glow--left" />
      <div className="landing__glow landing__glow--right" />
      <FloatingMovieCards layout="landing" />

      <header className="landing__header">
        <MovieDexLogo size="md" />
      </header>

      <div className="landing__content">
        <h1 className="landing__title">
          Every Movie Tells a Story.
          <span>Collect Yours.</span>
        </h1>
        <p className="landing__subtitle">
          Track. Review. Collect. Complete your MovieDex.
        </p>
        <button className="neon-button" type="button" onClick={onGetStarted}>
          Get Started
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  )
}

export default LandingPage
