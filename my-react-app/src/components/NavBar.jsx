function NavBar({ navigate }) {
  return (
    <header className="navbar">
      <a
        className="navbar__home"
        href="/"
        onClick={(e) => {
          e.preventDefault()
          navigate('home')
        }}
      >
        Home
      </a>
    </header>
  )
}

export default NavBar

