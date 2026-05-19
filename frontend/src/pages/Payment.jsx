import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../utils/api'

function Payment() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [timeLeft, setTimeLeft] = useState(0)
  const [paying, setPaying] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [done, setDone] = useState(false)

  const reservation = state?.reservation
  const event = state?.event

  // Hitung sisa waktu dari expires_at
  useEffect(() => {
    if (!reservation) return
    const expiresAt = new Date(reservation.expires_at).getTime()
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining === 0) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [reservation])

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0')
    const s = String(seconds % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  const formatPrice = (p) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(p)

  const handlePay = async () => {
    if (timeLeft === 0) return
    setPaying(true)
    try {
      const res = await api.post('/tickets/pay', { reservation_id: reservation.id })
      setMessage(res.data.message)
      setIsError(false)
      setDone(true)
    } catch (err) {
      setMessage(err.response?.data?.message || 'Pembayaran gagal')
      setIsError(true)
    } finally {
      setPaying(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await api.post('/tickets/cancel', { reservation_id: reservation.id })
      navigate('/')
    } catch (err) {
      setMessage('Gagal membatalkan')
      setIsError(true)
    } finally {
      setCancelling(false)
    }
  }

  if (!reservation || !event) {
    return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Data reservasi tidak ditemukan.</p>
  }

  const isExpired = timeLeft === 0
  const timerColor = timeLeft > 120 ? '#48bb78' : timeLeft > 60 ? '#ed8936' : '#e53e3e'

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <h2 style={{ margin: 0 }}>💳 Selesaikan Pembayaran</h2>
          {!done && (
            <div style={{ textAlign: 'center' }}>
              <p style={styles.timerLabel}>Sisa Waktu Pembayaran</p>
              <div style={{ ...styles.timer, color: timerColor }}>
                {isExpired ? 'EXPIRED' : formatTime(timeLeft)}
              </div>
              {isExpired && <p style={{ color: '#e53e3e' }}>Reservasi kamu sudah habis waktu.</p>}
            </div>
          )}
        </div>

        {/* Detail Pesanan */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Detail Pesanan</h3>
          <div style={styles.row}><span>Event</span><span style={styles.bold}>{event.name}</span></div>
          <div style={styles.row}><span>Venue</span><span>{event.venue}</span></div>
          <div style={styles.row}><span>Jumlah Tiket</span><span style={styles.bold}>{reservation.quantity} tiket</span></div>
          <div style={{ ...styles.row, borderTop: '2px solid #e2e8f0', paddingTop: '0.8rem', marginTop: '0.5rem' }}>
            <span style={styles.bold}>Total Pembayaran</span>
            <span style={{ ...styles.bold, fontSize: '1.2rem', color: '#1a1a2e' }}>
              {formatPrice(reservation.total_price)}
            </span>
          </div>
        </div>

        {/* Simulasi Metode Bayar */}
        {!done && !isExpired && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Metode Pembayaran</h3>
            <div style={styles.payMethod}>
              <span>🏦 Transfer Bank (Simulasi)</span>
              <span style={{ color: '#48bb78', fontWeight: 'bold' }}>✓ Dipilih</span>
            </div>
            <div style={styles.bankInfo}>
              <p style={{ margin: 0 }}>Bank: <strong>BCA</strong></p>
              <p style={{ margin: 0 }}>No. Rekening: <strong>1234-5678-9012</strong></p>
              <p style={{ margin: 0 }}>Atas Nama: <strong>TicketWar Indonesia</strong></p>
              <p style={{ margin: 0 }}>Nominal: <strong>{formatPrice(reservation.total_price)}</strong></p>
            </div>
          </div>
        )}

        {/* Pesan status */}
        {message && (
          <p style={{ color: isError ? '#e53e3e' : '#48bb78', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
            {message}
          </p>
        )}

        {/* Tombol aksi */}
        {!done && !isExpired && (
          <div style={styles.btnGroup}>
            <button onClick={handleCancel} disabled={cancelling} style={styles.cancelBtn}>
              {cancelling ? 'Membatalkan...' : 'Batalkan Reservasi'}
            </button>
            <button onClick={handlePay} disabled={paying} style={styles.payBtn}>
              {paying ? 'Memproses...' : '✅ Konfirmasi Pembayaran'}
            </button>
          </div>
        )}

        {done && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '3rem' }}>🎉</p>
            <button onClick={() => navigate('/my-tickets')} style={styles.payBtn}>
              Lihat Tiket Saya
            </button>
          </div>
        )}

        {isExpired && !done && (
          <button onClick={() => navigate('/')} style={styles.payBtn}>
            Kembali ke Beranda
          </button>
        )}

      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '600px', margin: '2rem auto', padding: '1rem' },
  card: { background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' },
  header: { textAlign: 'center', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  timerLabel: { color: '#718096', margin: '0.5rem 0 0' },
  timer: { fontSize: '3rem', fontWeight: 'bold', letterSpacing: '4px', fontFamily: 'monospace' },
  section: { background: '#f7fafc', borderRadius: '8px', padding: '1.2rem', marginBottom: '1rem' },
  sectionTitle: { margin: '0 0 1rem', color: '#1a1a2e', fontSize: '1rem' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.95rem' },
  bold: { fontWeight: 'bold' },
  payMethod: { display: 'flex', justifyContent: 'space-between', padding: '0.8rem',
    background: 'white', borderRadius: '6px', border: '2px solid #48bb78', marginBottom: '0.8rem' },
  bankInfo: { background: 'white', borderRadius: '6px', padding: '1rem',
    display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem', color: '#4a5568' },
  btnGroup: { display: 'flex', gap: '1rem', marginTop: '1.5rem' },
  cancelBtn: { flex: 1, padding: '0.8rem', background: 'white', border: '2px solid #e53e3e',
    color: '#e53e3e', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  payBtn: { flex: 1, padding: '0.8rem', background: '#1a1a2e', color: 'white',
    border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }
}

export default Payment