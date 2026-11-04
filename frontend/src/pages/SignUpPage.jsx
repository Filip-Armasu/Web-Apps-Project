import { useState } from 'react'
import MovieDexLogo from '../components/MovieDexLogo'
import FloatingMovieCards from '../components/FloatingMovieCards'
import './SignUpPage.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const SIGNUP_API_URL = '/api/register'

function SignUpPage({ onBack, onLogin, onSignUpSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.'
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    if (!agreeToTerms) {
      nextErrors.terms = 'You must agree before continuing.'
    }

    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (isLoading) return

    const nextErrors = validateForm()
    setErrors(nextErrors)
    setNotice('')

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const payload = {
      email: email.trim(),
      password,
    }

    setIsLoading(true)

    try {
      const response = await fetch(SIGNUP_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const contentType = response.headers.get('content-type') || ''

      if (!contentType.includes('application/json')) {
        throw new Error('Unexpected server response.')
      }

      const data = await response.json()

      if (!response.ok) {
        setNotice(
          typeof data?.message === 'string'
            ? data.message
            : typeof data?.error === 'string'
              ? data.error
              : 'Registration failed. Please try again.'
        )
        return
      }

      onSignUpSuccess()
    } catch (error) {
      setNotice(
        'Unable to complete registration. Please check the server connection.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="signup">
      <div className="signup__glow" />
      <FloatingMovieCards layout="login" />

      <button
        className="signup__back"
        type="button"
        onClick={onBack}
      >
        ← Back
      </button>

      <div className="signup__panel">
        <MovieDexLogo size="lg" />

        <h1 className="signup__title">
          Create Your Account
        </h1>

        <p className="signup__subtitle">
          Join MovieDex and start building your movie collection.
        </p>

        <form
          className="signup__form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="signup__field">
            <label
              className="signup__label"
              htmlFor="signup-email"
            >
              Email
            </label>

            <input
              id="signup-email"
              className={`signup__input ${
                errors.email ? 'signup__input--error' : ''
              }`}
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isLoading}
            />

            {errors.email && (
              <span className="signup__error">
                {errors.email}
              </span>
            )}
          </div>

          <div className="signup__field">
            <label
              className="signup__label"
              htmlFor="signup-password"
            >
              Password
            </label>

            <div className="signup__password-wrap">
              <input
                id="signup-password"
                className={`signup__input ${
                  errors.password ? 'signup__input--error' : ''
                }`}
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                placeholder="Create a password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading}
              />

              <button
                className="signup__toggle"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {errors.password && (
              <span className="signup__error">
                {errors.password}
              </span>
            )}
          </div>

          <div className="signup__field">
            <label
              className="signup__label"
              htmlFor="signup-confirm-password"
            >
              Confirm Password
            </label>

            <div className="signup__password-wrap">
              <input
                id="signup-confirm-password"
                className={`signup__input ${
                  errors.confirmPassword ? 'signup__input--error' : ''
                }`}
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                disabled={isLoading}
              />

              <button
                className="signup__toggle"
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                disabled={isLoading}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {errors.confirmPassword && (
              <span className="signup__error">
                {errors.confirmPassword}
              </span>
            )}
          </div>

          <div className="signup__terms">
            <label className="signup__terms-label">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(event) =>
                  setAgreeToTerms(event.target.checked)
                }
                disabled={isLoading}
              />

              <span>
                I agree to the Terms of Service and Privacy Policy.
              </span>
            </label>

            {errors.terms && (
              <span className="signup__error">
                {errors.terms}
              </span>
            )}
          </div>

          {notice && (
            <p className="signup__notice" role="alert">
              {notice}
            </p>
          )}

          <button
            className="neon-button neon-button--full"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="signup__login">
          Already have an account?{' '}
          <button
            className="signup__link"
            type="button"
            onClick={onLogin}
          >
            Log In
          </button>
        </p>
      </div>
    </section>
  )
}

export default SignUpPage

