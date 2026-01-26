import { useState, useEffect } from 'react'
import Home from './pages/Home'
import GetMeetingSummary from './pages/GetMeetingSummary'
import MeetgeekManager from './pages/MeetgeekManager'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  useEffect(() => {
    // Handle browser back/forward buttons
    const handlePopState = () => {
      const path = window.location.pathname
      if (path === '/get-meeting-summary') {
        setCurrentPage('get-meeting-summary')
      } else if (path === '/meetgeek-manager') {
        setCurrentPage('meetgeek-manager')
      } else {
        setCurrentPage('home')
      }
    }

    // Set initial page based on URL
    const path = window.location.pathname
    if (path === '/get-meeting-summary') {
      setCurrentPage('get-meeting-summary')
    } else if (path === '/meetgeek-manager') {
      setCurrentPage('meetgeek-manager')
    } else {
      setCurrentPage('home')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (page) => {
    setCurrentPage(page)
    const path = page === 'home' ? '/' : `/${page}`
    window.history.pushState({ page }, '', path)
  }

  return (
    <>
      {currentPage === 'home' && <Home navigate={navigate} />}
      {currentPage === 'get-meeting-summary' && <GetMeetingSummary />}
      {currentPage === 'meetgeek-manager' && <MeetgeekManager navigate={navigate} />}
    </>
  )
}

export default App
