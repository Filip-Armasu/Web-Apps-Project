
import { useState } from 'react'
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
  const [currentPage, setCurrentPage] = useState('home')

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

  if (currentPage === 'home') {
    return (
      <HomePage
      watchlist={watchlist}
      onToggleWatchlist={toggleWatchlist}
      onDiscover={() => setCurrentPage('home')}
      onWatchlist={() => setCurrentPage('watchlist')}
      onCollection={() => setCurrentPage('collection')}
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
      />
    )
  }

  if (currentPage === 'login') {
    return (
      <LoginPage
        onBack={() => setCurrentPage('landing')}
        onSignUp={() => setCurrentPage('signup')}
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
