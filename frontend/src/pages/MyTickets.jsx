import { useEffect, useState } from 'react'
import api from '../utils/api'

function MyTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/tickets/my')
      .then(res => setTickets(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const formatPrice = (price) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(price)

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎫 Tiket Saya</h1>

      {loading && <p style={styles.center}>Memuat tiket...</p>}

      {!loading && tickets.length === 0 && (
        <p style={styles.center}>Kamu belum memiliki tiket.</p>
      )}

      <div style={styles.grid}>
        {tickets.map(ticket => (
          <div key={ticket.id} style={styles.card}>
            <div style={styles.badge}>✅ {ticket.status.toUpperCase()}</div>
            <h2 style={styles.eventName}>{ticket.event_name}</h2>
            <p>📅 {formatDate(ticket.date)}</p>
            <p>📍 {ticket.venue}</p>
            <p>💰 {formatPrice(ticket.price)}</p>
            <p style={styles.bought}>
              Dibeli: {new Date(ticket.purchased_at).toLocaleString('id-ID')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '2rem' },
  title: { color: '#1a1a2e', marginBottom: '1.5rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' },
  card: { background: 'white', borderRadius: '8px', padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  badge: { background: '#c6f6d5', color: '#276749', padding: '0.3rem 0.7rem',
    borderRadius: '20px', fontSize: '0.8rem', width: 'fit-content', fontWeight: 'bold' },
  eventName: { color: '#1a1a2e', margin: '0.5rem 0' },
  bought: { color: '#a0aec0', fontSize: '0.8rem', marginTop: '0.5rem' },
  center: { textAlign: 'center', color: '#718096' }
}

export default MyTickets