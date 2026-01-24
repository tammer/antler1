import './Home.css'

function Home({ navigate }) {
  const handleNavigate = (e) => {
    e.preventDefault()
    navigate('get-meeting-summary')
  }

  return (
    <div className="home">
      <h1>Welcome</h1>
      <nav className="home-nav">
        <ul>
          <li>
            <a href="/get-meeting-summary" onClick={handleNavigate}>
              Get Meeting Summary
            </a>
          </li>
          <li>
            <a href="/prep-for-gemini" onClick={(e) => {
              e.preventDefault()
              navigate('prep-for-gemini')
            }}>
              Prep for Gemini
            </a>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export default Home
