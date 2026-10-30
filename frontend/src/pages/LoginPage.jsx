import { useState } from 'react'
import MovieDexLogo from '../components/MovieDexLogo'
import FloatingMovieCards from '../components/FloatingMovieCards'
import './LoginPage.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function LoginPage({ onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')

  function validateForm() {
    const nextErrors = {}

    if (!email.trim()) {
      nextErrors.email = 'Please enter your email.'
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    if (!password) {
      nextErrors.password = 'Please enter your password.'
    }

    return nextErrors
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateForm()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setNotice('')
      return
    }

    setNotice('Login will be available once the backend is connected.')
  }

  function showComingSoon(event) {
    event.preventDefault()
    setNotice('Coming Soon')
  }

  return (
    <section className="login">
      <div className="login__glow" />
      <FloatingMovieCards layout="login" />

      <button className="login__back" type="button" onClick={onBack}>
        ← Back
      </button>

      <div className="login__panel">
        <MovieDexLogo size="lg" />
        <p className="login__subtitle">Your Movie Collection Begins Here</p>

        <form className="login__form" onSubmit={handleSubmit} noValidate>
          <div className="login__field">
            <label className="login__label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className={errors.email ? 'login__input login__input--error' : 'login__input'}
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {errors.email ? <span className="login__error">{errors.email}</span> : null}
          </div>

          <div className="login__field">
            <label className="login__label" htmlFor="login-password">
              Password
            </label>
            <div className="login__password-wrap">
              <input
                id="login-password"
                className={
                  errors.password ? 'login__input login__input--error' : 'login__input'
                }
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                className="login__toggle"
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password ? (
              <span className="login__error">{errors.password}</span>
            ) : null}
          </div>

          <div className="login__row">
            <label className="login__remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              Remember Me
            </label>
            <button className="login__link" type="button" onClick={showComingSoon}>
              Forgot password?
            </button>
          </div>

          {notice ? <p className="login__notice">{notice}</p> : null}

          <button className="neon-button neon-button--full" type="submit">
            Log in
          </button>
        </form>

        <p className="login__signup">
          Don&apos;t have an account?{' '}
          <button className="login__link" type="button" onClick={showComingSoon}>
            Sign Up
          </button>
        </p>
      </div>
    </section>
  )
}

export default LoginPage
