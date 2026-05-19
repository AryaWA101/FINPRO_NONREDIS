import { useEffect, useState } from 'react'
import EventCard from '../components/EventCard'
import api from '../utils/api'

function Home() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/events')
      .then(res => setEvents(res.data))
      .catch(() => setError('Gagal memuat events'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>🎫 TicketWar</h1>
        <p>Dapatkan tiket konser favoritmu sebelum kehabisan!</p>
      </div>

      {loading && <p style={styles.center}>Memuat events...</p>}
      {error && <p style={{ ...styles.center, color: 'red' }}>{error}</p>}

      <div style={styles.grid}>
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '2rem' },
  header: { textAlign: 'center', marginBottom: '2rem', color: '#1a1a2e' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' },
  center: { textAlign: 'center' }
}

export default Home