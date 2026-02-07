import { useEffect, useState } from 'react'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import MeetgeekManager from './pages/MeetgeekManager'
import Notes from './pages/Notes'
import { useAllPeople } from './lib/useAllPeople'
import Login from './pages/Login'
import { supabase } from './lib/supabaseClient'
import { useSupabaseSession } from './lib/useSupabaseSession'
import './App.css'

const pageFromPath = (path) => {
  if (path === '/login') return 'login'
  if (path === '/meetgeek-manager') return 'meetgeek-manager'
  if (path === '/notes' || path.startsWith('/notes/')) return 'notes'
  return 'home'
}

function App() {
  const [currentPage, setCurrentPage] = useState(() => pageFromPath(window.location.pathname))
  const { session, user, isLoading: isAuthLoading } = useSupabaseSession()
  const isAuthed = !!session

  const { allPeople, ensureAllPeopleLoaded, isLoadingAllPeople, allPeopleError } = useAllPeople({
    enabled: isAuthed
  })

  useEffect(() => {
    // Handle browser back/forward buttons
    const handlePopState = () => {
      setCurrentPage(pageFromPath(window.location.pathname))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (isAuthLoading) return

    if (!isAuthed) {
      if (window.location.pathname !== '/login') {
        window.history.replaceState({ page: 'login' }, '', '/login')
      }
    }

    // If you're logged in and sitting on /login, send you home.
    if (window.location.pathname === '/login') {
      window.history.replaceState({ page: 'home' }, '', '/')
    }
  }, [isAuthLoading, isAuthed])

  const navigate = (page) => {
    const nextPage = !isAuthed && page !== 'login' ? 'login' : page
    setCurrentPage(nextPage)
    const path = nextPage === 'home' ? '/' : `/${nextPage}`
    window.history.pushState({ page: nextPage }, '', path)
  }

  const activePage = isAuthed && currentPage === 'login' ? 'home' : currentPage

  return (
    <div className="app-shell">
      <NavBar
        navigate={navigate}
        isAuthed={isAuthed}
        userEmail={user?.email ?? ''}
        onLogout={async () => {
          await supabase.auth.signOut()
          navigate('login')
        }}
      />
      <div className="app-shell__content">
        {isAuthLoading && <div className="app-shell__loading">Loading…</div>}

        {!isAuthLoading && !isAuthed && (
          <Login
            onLoginSuccess={() => {
              navigate('home')
            }}
          />
        )}

        {!isAuthLoading && isAuthed && activePage === 'home' && <Home navigate={navigate} />}
        {!isAuthLoading && isAuthed && activePage === 'meetgeek-manager' && <MeetgeekManager />}
        {!isAuthLoading && isAuthed && activePage === 'notes' && (
          <Notes
            allPeople={allPeople}
            ensureAllPeopleLoaded={ensureAllPeopleLoaded}
            isLoadingAllPeople={isLoadingAllPeople}
            allPeopleError={allPeopleError}
            userEmail={user?.email ?? ''}
          />
        )}
      </div>
    </div>
  )
}

export default App
