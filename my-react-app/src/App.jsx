import { useState, useEffect } from 'react'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import GetMeetingSummary from './pages/GetMeetingSummary'
import MeetgeekManager from './pages/MeetgeekManager'
import Notes from './pages/Notes'
import { useAllPeople } from './lib/useAllPeople'
import './App.css'

const pageFromPath = (path) => {
  if (path === '/get-meeting-summary') return 'get-meeting-summary'
  if (path === '/meetgeek-manager') return 'meetgeek-manager'
  if (path === '/notes') return 'notes'
  return 'home'
}

function App() {
  const [currentPage, setCurrentPage] = useState(() => pageFromPath(window.location.pathname))
  const { allPeople, ensureAllPeopleLoaded, isLoadingAllPeople, allPeopleError } = useAllPeople()

  useEffect(() => {
    // Handle browser back/forward buttons
    const handlePopState = () => {
      setCurrentPage(pageFromPath(window.location.pathname))
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
    <div className="app-shell">
      <NavBar navigate={navigate} />
      <div className="app-shell__content">
        {currentPage === 'home' && <Home navigate={navigate} />}
        {currentPage === 'get-meeting-summary' && <GetMeetingSummary />}
        {currentPage === 'meetgeek-manager' && <MeetgeekManager />}
        {currentPage === 'notes' && (
          <Notes
            allPeople={allPeople}
            ensureAllPeopleLoaded={ensureAllPeopleLoaded}
            isLoadingAllPeople={isLoadingAllPeople}
            allPeopleError={allPeopleError}
          />
        )}
      </div>
    </div>
  )
}

export default App
