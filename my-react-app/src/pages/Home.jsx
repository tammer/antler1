import './Home.css'

function Home({ navigate }) {
  return (
    <div className="home">
      <h1>Welcome</h1>
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
        </ul>
      </nav>
    </div>
  )
}

export default Home
