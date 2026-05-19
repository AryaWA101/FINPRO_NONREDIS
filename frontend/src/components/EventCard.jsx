import { useNavigate } from 'react-router-dom'

function EventCard({ event }) {
  const navigate = useNavigate()

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(price)
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>{event.name}</h2>
      <p style={styles.desc}>{event.description}</p>
      <div style={styles.info}>
        <p>📅 {formatDate(event.date)}</p>
        <p>📍 {event.venue}</p>
        <p>💰 {formatPrice(event.price)}</p>
        <p style={{ color: event.available_tickets > 0 ? '#48bb78' : '#e53e3e' }}>
          🎫 {event.available_tickets > 0
            ? `${event.available_tickets} tiket tersisa`
            : 'TIKET HABIS'}
        </p>
      </div>
      <button
        onClick={() => navigate(`/events/${event.id}`)}
        style={styles.btn}
        disabled={event.available_tickets === 0}
      >
        {event.available_tickets > 0 ? 'Lihat & Beli' : 'Habis'}
      </button>
    </div>
  )
}

const styles = {
  card: { background: 'white', borderRadius: '8px', padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  title: { margin: 0, color: '#1a1a2e' },
  desc: { color: '#718096', margin: 0 },
  info: { display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.9rem' },
  btn: { marginTop: '1rem', padding: '0.6rem', backgroundColor: '#1a1a2e',
    color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
}

export default EventCard