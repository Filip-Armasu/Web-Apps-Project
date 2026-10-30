import { useState } from 'react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('landing')

  if (currentPage === 'login') {
    return <LoginPage onBack={() => setCurrentPage('landing')} />
  }

  return <LandingPage onGetStarted={() => setCurrentPage('login')} />
}

export default App
