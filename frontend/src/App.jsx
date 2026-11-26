import { useState, useEffect, useRef, useCallback } from 'react'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import HomePage from './pages/HomePage'
import WatchlistPage from './pages/WatchlistPage'
import CollectionPage from './pages/CollectionPage'

import {
  getUserMovies,
  addToWatchlist,
  updateMovieStatus,
  removeUserMovie,
} from './api/watchlistApi'

import './App.css'

const PAGE_STORAGE_KEY = 'moviedex-current-page'

const AUTHENTICATED_PAGES = [
  'home',
  'watchlist',
  'collection',
]

function getSavedPage() {
  try {
    const savedPage = sessionStorage.getItem(
      PAGE_STORAGE_KEY
    )

    return AUTHENTICATED_PAGES.includes(savedPage)
      ? savedPage
      : 'home'
  } catch {
    return 'home'
  }
}

function App() {
  // Authentication and navigation
  const [currentPage, setCurrentPage] = useState('landing')
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [user, setUser] = useState(null)

  // Database-backed movie lists
  const [userMovies, setUserMovies] = useState([])
  const [isLoadingMovies, setIsLoadingMovies] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [listError, setListError] = useState('')

  const sessionRef = useRef(0)
  const updatingRef = useRef(false)

  // Separate watchlist and watched movies
  const watchlist = userMovies.filter(
    (movie) => movie.status === 'watchlist'
  )

  const collection = userMovies.filter(
    (movie) => movie.status === 'watched'
  )

  // Check whether the user is already logged in
  useEffect(() => {
    const controller = new AbortController()

    async function checkLogin() {
      try {
        const response = await fetch('/api/me', {
          credentials: 'same-origin',
          signal: controller.signal,
        })

        if (response.ok) {
          const data = await response.json()

          if (!controller.signal.aborted) {
            setUser(data.user)
            setCurrentPage(getSavedPage())
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Login check failed:', error)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCheckingAuth(false)
        }
      }
    }

    checkLogin()

    return () => controller.abort()
  }, [])

  // Remember the current authenticated page
useEffect(() => {
  if (
    !isCheckingAuth &&
    user &&
    AUTHENTICATED_PAGES.includes(currentPage)
  ) {
    try {
      sessionStorage.setItem(
        PAGE_STORAGE_KEY,
        currentPage
      )
    } catch (error) {
      console.error('Page storage failed:', error)
    }
  }
}, [currentPage, user, isCheckingAuth])


  // Clear private data when the session ends
const clearSession = useCallback((nextPage = 'login') => {
  sessionRef.current += 1
  updatingRef.current = false

  try {
    sessionStorage.removeItem(PAGE_STORAGE_KEY)
  } catch (error) {
    console.error('Page storage cleanup failed:', error)
  }

  setUser(null)
  setUserMovies([])
  setListError('')
  setIsLoadingMovies(false)
  setIsUpdating(false)
  setCurrentPage(nextPage)
}, [])

  // Load private movie data after login
  useEffect(() => {
    if (!user?.id) return

    const controller = new AbortController()
    const session = sessionRef.current

    async function loadUserMovies() {
      setIsLoadingMovies(true)
      setListError('')

      try {
        const movies = await getUserMovies(
          undefined,
          controller.signal
        )

        if (
          !controller.signal.aborted &&
          session === sessionRef.current
        ) {
          setUserMovies(movies)
        }
      } catch (error) {
        if (
          controller.signal.aborted ||
          session !== sessionRef.current
        ) {
          return
        }

        if (error.status === 401) {
          clearSession()
        } else {
          setListError(error.message)
        }
      } finally {
        if (
          !controller.signal.aborted &&
          session === sessionRef.current
        ) {
          setIsLoadingMovies(false)
        }
      }
    }

    loadUserMovies()

    return () => controller.abort()
  }, [user?.id, clearSession])

  // Logout and remove private data from React state
  async function handleLogout() {
    if (updatingRef.current) return

    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'same-origin',
      })

      if (!response.ok) {
        throw new Error('Logout failed')
      }

      clearSession('landing')
    } catch (error) {
      console.error('Logout error:', error)
      alert('Logout failed. Please try again.')
    }
  }

  // Execute a database update and reload private lists
  async function performMovieAction(action) {
    if (
      !user ||
      updatingRef.current ||
      isLoadingMovies ||
      listError
    ) {
      return
    }

    const session = sessionRef.current

    updatingRef.current = true
    setIsUpdating(true)

    try {
      await action()

      if (session !== sessionRef.current) return

      const movies = await getUserMovies()

      if (session === sessionRef.current) {
        setUserMovies(movies)
      }
    } catch (error) {
      if (session !== sessionRef.current) return

      if (error.status === 401) {
        clearSession()
      } else {
        console.error('Movie action failed:', error)
        setListError(
          'Unable to synchronize your movies. Please reload the page.'
        )
      }
    } finally {
      if (session === sessionRef.current) {
        updatingRef.current = false
        setIsUpdating(false)
      }
    }
  }

  // Add or remove a movie from the watchlist
  async function toggleWatchlist(movieId) {
    const isWatched = collection.some(
      (movie) => movie.id === movieId
    )

    // Prevent watched movies from being moved back accidentally
    if (isWatched) return

    const isSaved = watchlist.some(
      (movie) => movie.id === movieId
    )

    await performMovieAction(() =>
      isSaved
        ? removeUserMovie(movieId)
        : addToWatchlist(movieId)
    )
  }

  // Remove a movie from the watchlist
  async function removeFromWatchlist(movieId) {
    await performMovieAction(() =>
      removeUserMovie(movieId)
    )
  }

  // Move a movie from watchlist to collection
  async function markAsWatched(movieId) {
    await performMovieAction(() =>
      updateMovieStatus(movieId, 'watched')
    )
  }

  // Remove a movie from the collection
  async function removeFromCollection(movieId) {
    await performMovieAction(() =>
      removeUserMovie(movieId)
    )
  }

  // Authentication loading screen
  if (isCheckingAuth) {
    return <div>Checking login...</div>
  }

  // Private data loading screen
  if (user && isLoadingMovies) {
    return <div>Loading your movies...</div>
  }

  // Private data error screen
  if (user && listError) {
    return (
      <div role="alert">
        <p>{listError}</p>

        <button onClick={() => window.location.reload()}>
          Reload
        </button>

        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    )
  }

  // Discover page
  if (currentPage === 'home' && user) {
    return (
      <HomePage
        userId={user?.id}
        watchlist={watchlist.map((movie) => movie.id)}
        collection={collection.map((movie) => movie.id)}
        isUpdating={isUpdating}
        onToggleWatchlist={toggleWatchlist}
        onDiscover={() => setCurrentPage('home')}
        onWatchlist={() => setCurrentPage('watchlist')}
        onCollection={() => setCurrentPage('collection')}
        onLogout={handleLogout}
        onSessionExpired={clearSession}
      />
    )
  }

  // Watchlist page
  if (currentPage === 'watchlist' && user) {
    return (
      <WatchlistPage
        watchlist={watchlist}
        isUpdating={isUpdating}
        onRemove={removeFromWatchlist}
        onMarkWatched={markAsWatched}
        onDiscover={() => setCurrentPage('home')}
        onCollection={() => setCurrentPage('collection')}
        onLogout={handleLogout}
      />
    )
  }

 // Collection page
if (currentPage === 'collection' && user) {
  return (
    <CollectionPage
      collection={collection}
      userId={user.id}
      isUpdating={isUpdating}
      onDiscover={() => setCurrentPage('home')}
      onWatchlist={() => setCurrentPage('watchlist')}
      onRemove={removeFromCollection}
      onLogout={handleLogout}
      onSessionExpired={clearSession}
    />
  )
}

  // Login page
  if (currentPage === 'login') {
    return (
      <LoginPage
        onBack={() => setCurrentPage('landing')}
        onSignUp={() => setCurrentPage('signup')}
        onLoginSuccess={(loggedInUser) => {
          sessionRef.current += 1

          setUserMovies([])
          setListError('')
          setUser(loggedInUser)
          setCurrentPage('home')
        }}
      />
    )
  }

  // Sign-up page
  if (currentPage === 'signup') {
    return (
      <SignUpPage
        onBack={() => setCurrentPage('login')}
        onLogin={() => setCurrentPage('login')}
        onSignUpSuccess={() => setCurrentPage('login')}
      />
    )
  }

  // Landing page
  return (
    <LandingPage
      onGetStarted={() => setCurrentPage('login')}
    />
  )
}

export default App
