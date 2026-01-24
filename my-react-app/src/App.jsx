import { useState, useEffect } from 'react'
import Home from './pages/Home'
import GetMeetingSummary from './pages/GetMeetingSummary'
import PrepForGemini from './pages/PrepForGemini'
import PrepForGemini2 from './pages/PrepForGemini2'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  useEffect(() => {
    // Handle browser back/forward buttons
    const handlePopState = () => {
      const path = window.location.pathname
      if (path === '/get-meeting-summary') {
        setCurrentPage('get-meeting-summary')
      } else if (path === '/prep-for-gemini') {
        setCurrentPage('prep-for-gemini')
      } else if (path === '/prep-for-gemini-2') {
        setCurrentPage('prep-for-gemini-2')
      } else {
        setCurrentPage('home')
      }
    }

    // Set initial page based on URL
    const path = window.location.pathname
    if (path === '/get-meeting-summary') {
      setCurrentPage('get-meeting-summary')
    } else if (path === '/prep-for-gemini') {
      setCurrentPage('prep-for-gemini')
    } else if (path === '/prep-for-gemini-2') {
      setCurrentPage('prep-for-gemini-2')
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
      {currentPage === 'prep-for-gemini' && <PrepForGemini navigate={navigate} />}
      {currentPage === 'prep-for-gemini-2' && <PrepForGemini2 navigate={navigate} />}
    </>
  )
}

export default App
