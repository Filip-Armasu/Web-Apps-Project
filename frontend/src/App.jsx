import { useState, useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import HomePage from './pages/HomePage'
import WatchlistPage from './pages/WatchlistPage'
import './App.css'
import CollectionPage from './pages/CollectionPage'


function readSavedIds(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
const [user, setUser] = useState(null)

useEffect(() => {
  async function checkLogin() {
    try {
      const response = await fetch('/api/me', {
        credentials: 'same-origin',
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setCurrentPage('home')
      }
    } catch (error) {
      console.error('Login check failed:', error)
    } finally {
      setIsCheckingAuth(false)
    }
  }

  checkLogin()
}, [])


async function handleLogout() {
  try {
    const response = await fetch('/api/logout', {
      method: 'POST',
      credentials: 'same-origin',
    })

    if (!response.ok) {
      throw new Error('Logout failed')
    }

    setUser(null)
    setCurrentPage('landing')
  } catch (error) {
    console.error('Logout error:', error)
    alert('Logout failed. Please try again.')
  }
}

  const [watchlist, setWatchlist] = useState(() =>
    readSavedIds('moviedex-watchlist')
  )

  const [collection, setCollection] = useState(() =>
    readSavedIds('moviedex-collection')
  )

  function toggleWatchlist(movieId) {
    setWatchlist((previous) => {
      const updated = previous.includes(movieId)
        ? previous.filter((id) => id !== movieId)
        : [...previous, movieId]

      localStorage.setItem(
        'moviedex-watchlist',
        JSON.stringify(updated)
      )

      return updated
    })
  }

  function removeFromWatchlist(movieId) {
    setWatchlist((previous) => {
      const updated = previous.filter((id) => id !== movieId)

      localStorage.setItem(
        'moviedex-watchlist',
        JSON.stringify(updated)
      )

      return updated
    })
  }

  function markAsWatched(movieId) {
    removeFromWatchlist(movieId)

    setCollection((previous) => {
      const updated = previous.includes(movieId)
        ? previous
        : [...previous, movieId]

      localStorage.setItem(
        'moviedex-collection',
        JSON.stringify(updated)
      )

      return updated
    })
  }

  function removeFromCollection(movieId) {
    setCollection((previous) => {
      const updated = previous.filter((id) => id !== movieId)
  
      localStorage.setItem(
        'moviedex-collection',
        JSON.stringify(updated)
      )
  
      return updated
    })
  }

  if (isCheckingAuth) {
    return <div>Checking login...</div>
  }

  if (currentPage === 'home') {
    return (
      <HomePage
      watchlist={watchlist}
      onToggleWatchlist={toggleWatchlist}
      onDiscover={() => setCurrentPage('home')}
      onWatchlist={() => setCurrentPage('watchlist')}
      onCollection={() => setCurrentPage('collection')}
      onLogout={handleLogout}
    />
    )
  }

  if (currentPage === 'watchlist') {
    return (
      <WatchlistPage
        watchlist={watchlist}
        onRemove={removeFromWatchlist}
        onMarkWatched={markAsWatched}
        onDiscover={() => setCurrentPage('home')}
        onCollection={() => setCurrentPage('collection')}
        onLogout={handleLogout}
      />
    )
  }

  if (currentPage === 'collection') {
    return (
      <CollectionPage
        collection={collection}
        onDiscover={() => setCurrentPage('home')}
        onWatchlist={() => setCurrentPage('watchlist')}
        onRemove={removeFromCollection}
        onLogout={handleLogout}
      />
    )
  }

  if (currentPage === 'login') {
    return (
      <LoginPage
        onBack={() => setCurrentPage('landing')}
        onSignUp={() => setCurrentPage('signup')}
onLoginSuccess={(loggedInUser) => {
  setUser(loggedInUser)
  setCurrentPage('home')
}}
      />
    )
  }

  if (currentPage === 'signup') {
    return (
      <SignUpPage
        onBack={() => setCurrentPage('login')}
        onLogin={() => setCurrentPage('login')}
        onSignUpSuccess={() => setCurrentPage('login')}
      />
    )
  }

  return (
    <LandingPage
      onGetStarted={() => setCurrentPage('login')}
    />
  )
}

export default App
