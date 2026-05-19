import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'

function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [reserving, setReserving] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    api.get(`/events/${id}`)
      .then(res => setEvent(res.data))
      .catch(() => setMessage('Event tidak ditemukan'))
      .finally(() => setLoading(false))
  }, [id])

  const handleReserve = async () => {
    if (!localStorage.getItem('token')) return navigate('/login')

    setReserving(true)
    setMessage('')
    try {
      const res = await api.post('/tickets/reserve', {
        event_id: parseInt(id),
        quantity
      })
      // Redirect ke halaman pembayaran
      navigate('/payment', { state: { reservation: res.data.reservation, event: res.data.event } })
    } catch (err) {
      setMessage(err.response?.data?.message || 'Reservasi gagal')
      setIsError(true)
    } finally {
      setReserving(false)
    }
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
  const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p)

  if (loading) return <p style={styles.center}>Memuat...</p>
  if (!event) return <p style={styles.center}>Event tidak ditemukan</p>

  const maxQty = Math.min(10, event.available_tickets)

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/')} style={styles.back}>← Kembali</button>
      <div style={styles.card}>
        <h1 style={styles.title}>{event.name}</h1>
        <p style={styles.desc}>{event.description}</p>

        <div style={styles.details}>
          <p>📅 {formatDate(event.date)}</p>
          <p>📍 {event.venue}</p>
          <p>💰 {formatPrice(event.price)} / tiket</p>
          <p style={{ color: event.available_tickets > 0 ? '#48bb78' : '#e53e3e', fontWeight: 'bold' }}>
            🎫 {event.available_tickets > 0 ? `${event.available_tickets} tiket tersisa` : 'TIKET HABIS'}
          </p>
        </div>

        {event.available_tickets > 0 && (
          <div style={styles.orderBox}>
            <h3 style={{ margin: '0 0 1rem' }}>Pesan Tiket</h3>

            <div style={styles.qtyRow}>
              <label>Jumlah Tiket:</label>
              <div style={styles.qtyControl}>
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={styles.qtyBtn}>−</button>
                <span style={styles.qtyNum}>{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(maxQty, q + 1))} style={styles.qtyBtn}>+</button>
              </div>
            </div>

            <div style={styles.totalRow}>
              <span>Total:</span>
              <span style={styles.totalPrice}>{formatPrice(event.price * quantity)}</span>
            </div>

            <p style={styles.note}>⏱ Setelah reservasi, kamu punya <strong>10 menit</strong> untuk menyelesaikan pembayaran.</p>

            {message && <p style={{ color: isError ? 'red' : 'green', textAlign: 'center' }}>{message}</p>}

            <button onClick={handleReserve} disabled={reserving} style={styles.btn}>
              {reserving ? 'Memproses...' : '🎫 Reservasi Sekarang'}
            </button>
          </div>
        )}

        {event.available_tickets === 0 && (
          <div style={{ ...styles.orderBox, textAlign: 'center', color: '#e53e3e' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>😢 Tiket Habis</p>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '700px', margin: '0 auto', padding: '2rem' },
  back: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', marginBottom: '1rem' },
  card: { background: 'white', borderRadius: '8px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  title: { color: '#1a1a2e', marginBottom: '0.5rem' },
  desc: { color: '#718096' },
  details: { display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1.5rem 0' },
  orderBox: { background: '#f7fafc', borderRadius: '8px', padding: '1.5rem', marginTop: '1rem' },
  qtyRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  qtyControl: { display: 'flex', alignItems: 'center', gap: '1rem' },
  qtyBtn: { width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #cbd5e0',
    background: 'white', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  qtyNum: { fontSize: '1.2rem', fontWeight: 'bold', minWidth: '30px', textAlign: 'center' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 0', borderTop: '1px solid #e2e8f0', marginBottom: '1rem' },
  totalPrice: { fontSize: '1.3rem', fontWeight: 'bold', color: '#1a1a2e' },
  note: { fontSize: '0.85rem', color: '#718096', marginBottom: '1rem', textAlign: 'center' },
  btn: { width: '100%', padding: '0.9rem', backgroundColor: '#1a1a2e', color: 'white',
    border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' },
  center: { textAlign: 'center', marginTop: '2rem' }
}

export default EventDetail