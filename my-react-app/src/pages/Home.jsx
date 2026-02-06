import './Home.css'

function Home({ navigate }) {
  return (
    <div className="home">
      <h1>Select a tool</h1>
      <nav className="home-nav">
        <ul>
          <li>
            <a href="/meetgeek-manager" onClick={(e) => {
              e.preventDefault()
              navigate('meetgeek-manager')
            }}>
              Meetgeek Manager
            </a>
          </li>
          <li>
            <a href="/notes" onClick={(e) => {
              e.preventDefault()
              navigate('notes')
            }}>
              Notes
            </a>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export default Home
