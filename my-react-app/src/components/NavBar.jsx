function NavBar({ navigate, isAuthed, userEmail, onLogout }) {
  return (
    <header className="navbar">
      <a
        className="navbar__home"
        href="/"
        onClick={(e) => {
          e.preventDefault()
          navigate(isAuthed ? 'home' : 'login')
        }}
      >
        Home
      </a>

      <div className="navbar__spacer" />

      <div className="navbar__auth">
        {isAuthed && !!userEmail && <span className="navbar__user">{userEmail}</span>}
        {isAuthed ? (
          <button className="navbar__authButton" type="button" onClick={onLogout}>
            Logout
          </button>
        ) : (
          <button
            className="navbar__authButton"
            type="button"
            onClick={() => navigate('login')}
          >
            Login
          </button>
        )}
      </div>
    </header>
  )
}

export default NavBar

