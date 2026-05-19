import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

function TicketForm({ eventId, available }) {
  const [buying, setBuying] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const navigate = useNavigate()

  const handleBuy = async () => {
    const token = localStorage.getItem('token')
    if (!token) return navigate('/login')

    setBuying(true)
    setMessage('')
    try {
      const res = await api.post('/tickets/buy', { event_id: eventId })
      setMessage(res.data.message)
      setIsError(false)
    } catch (err) {
      setMessage(err.response?.data?.message || 'Pembelian gagal')
      setIsError(true)
    } finally {
      setBuying(false)
    }
  }

  return (
    <div style={styles.container}>
      {message && (
        <p style={{ color: isError ? 'red' : 'green', fontWeight: 'bold', textAlign: 'center' }}>
          {message}
        </p>
      )}
      <button
        onClick={handleBuy}
        disabled={buying || !available}
        style={{
          ...styles.btn,
          backgroundColor: !available ? '#a0aec0' : '#1a1a2e',
          cursor: !available ? 'not-allowed' : 'pointer'
        }}
      >
        {buying ? 'Memproses...' : available ? '🎫 Beli Tiket Sekarang' : 'Tiket Habis'}
      </button>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' },
  btn: { width: '100%', padding: '0.9rem', color: 'white', border: 'none',
    borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold' }
}

export default TicketForm