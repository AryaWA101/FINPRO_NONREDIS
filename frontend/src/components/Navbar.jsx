import { Link, useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>🎫 TicketWar</Link>
      <div style={styles.links}>
        {token ? (
          <>
            <span style={styles.username}>Halo, {user.name}</span>
            <Link to="/my-tickets" style={styles.link}>Tiket Saya</Link>
            {user.is_admin && (
              <Link to="/admin" style={styles.adminLink}>⚙️ Admin</Link>
            )}
            <button onClick={logout} style={styles.btn}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/register" style={styles.link}>Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}

const styles = {
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 2rem', backgroundColor: '#1a1a2e', color: 'white' },
  brand: { color: 'white', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold' },
  links: { display: 'flex', alignItems: 'center', gap: '1rem' },
  link: { color: 'white', textDecoration: 'none' },
  adminLink: { color: '#fbd38d', textDecoration: 'none', fontWeight: 'bold' },
  username: { color: '#a0aec0' },
  btn: { background: '#e53e3e', color: 'white', border: 'none',
    padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer' }
}

export default Navbar