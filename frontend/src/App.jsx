import { useState } from 'react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('landing')

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
