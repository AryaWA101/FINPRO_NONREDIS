import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

function Admin() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('events')
  const [message, setMessage] = useState({ text: '', isError: false })

  // Form tambah event
  const [form, setForm] = useState({
    name: '', description: '', date: '', venue: '', price: '', total_tickets: ''
  })

  // Form tambah stok
  const [stockForm, setStockForm] = useState({ eventId: '', additional_tickets: '' })

  const fetchEvents = () => {
    setLoading(true)
    api.get('/admin/events')
      .then(res => setEvents(res.data))
      .catch(err => {
        if (err.response?.status === 403) navigate('/')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchEvents() }, [])

  const showMessage = (text, isError = false) => {
    setMessage({ text, isError })
    setTimeout(() => setMessage({ text: '', isError: false }), 3000)
  }

  const handleAddEvent = async (e) => {
    e.preventDefault()
    try {
      await api.post('/admin/events', {
        ...form,
        price: parseFloat(form.price),
        total_tickets: parseInt(form.total_tickets)
      })
      showMessage('Event berhasil ditambahkan!')
      setForm({ name: '', description: '', date: '', venue: '', price: '', total_tickets: '' })
      fetchEvents()
    } catch (err) {
      showMessage(err.response?.data?.message || 'Gagal menambahkan event', true)
    }
  }

  const handleUpdateStock = async (e) => {
    e.preventDefault()
    try {
      await api.patch(`/admin/events/${stockForm.eventId}/stock`, {
        additional_tickets: parseInt(stockForm.additional_tickets)
      })
      showMessage('Stok tiket berhasil diupdate!')
      setStockForm({ eventId: '', additional_tickets: '' })
      fetchEvents()
    } catch (err) {
      showMessage(err.response?.data?.message || 'Gagal update stok', true)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus event "${name}"? Semua data tiket terkait akan terhapus.`)) return
    try {
      await api.delete(`/admin/events/${id}`)
      showMessage('Event berhasil dihapus!')
      fetchEvents()
    } catch (err) {
      showMessage('Gagal menghapus event', true)
    }
  }

  const formatPrice = (p) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(p)

  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>⚙️ Admin Dashboard</h1>

      {/* Notifikasi */}
      {message.text && (
        <div style={{ ...styles.alert, background: message.isError ? '#fff5f5' : '#f0fff4',
          borderColor: message.isError ? '#fc8181' : '#68d391', color: message.isError ? '#c53030' : '#276749' }}>
          {message.text}
        </div>
      )}

      {/* Tab */}
      <div style={styles.tabs}>
        {['events', 'add', 'stock'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ ...styles.tab, ...(activeTab === tab ? styles.activeTab : {}) }}>
            {tab === 'events' ? '📋 Daftar Event' : tab === 'add' ? '➕ Tambah Event' : '🎫 Tambah Stok'}
          </button>
        ))}
      </div>

      {/* Tab: Daftar Event */}
      {activeTab === 'events' && (
        <div>
          {loading ? <p style={styles.center}>Memuat...</p> : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>Event</th>
                    <th style={styles.th}>Tanggal</th>
                    <th style={styles.th}>Harga</th>
                    <th style={styles.th}>Stok</th>
                    <th style={styles.th}>Terjual</th>
                    <th style={styles.th}>Revenue</th>
                    <th style={styles.th}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => (
                    <tr key={event.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.eventName}>{event.name}</div>
                        <div style={styles.venue}>📍 {event.venue}</div>
                      </td>
                      <td style={styles.td}>{formatDate(event.date)}</td>
                      <td style={styles.td}>{formatPrice(event.price)}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.stockBadge,
                          background: event.available_tickets > 10 ? '#c6f6d5' : event.available_tickets > 0 ? '#fefcbf' : '#fed7d7',
                          color: event.available_tickets > 10 ? '#276749' : event.available_tickets > 0 ? '#744210' : '#c53030'
                        }}>
                          {event.available_tickets}/{event.total_tickets}
                        </span>
                      </td>
                      <td style={styles.td}>{event.total_sold} tiket</td>
                      <td style={styles.td}>{formatPrice(event.total_revenue)}</td>
                      <td style={styles.td}>
                        <button onClick={() => handleDelete(event.id, event.name)} style={styles.deleteBtn}>
                          🗑 Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Tambah Event */}
      {activeTab === 'add' && (
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>Tambah Event Baru</h2>
          <form onSubmit={handleAddEvent} style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nama Event *</label>
                <input style={styles.input} placeholder="cth: Coldplay World Tour"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Venue *</label>
                <input style={styles.input} placeholder="cth: GBK Stadium Jakarta"
                  value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} required />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Deskripsi</label>
              <textarea style={{ ...styles.input, height: '80px', resize: 'vertical' }}
                placeholder="Deskripsi event..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Tanggal & Waktu *</label>
                <input style={styles.input} type="datetime-local"
                  value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Harga (Rp) *</label>
                <input style={styles.input} type="number" placeholder="cth: 500000"
                  value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Jumlah Tiket *</label>
                <input style={styles.input} type="number" placeholder="cth: 100"
                  value={form.total_tickets} onChange={e => setForm({ ...form, total_tickets: e.target.value })} required />
              </div>
            </div>
            <button type="submit" style={styles.submitBtn}>➕ Tambah Event</button>
          </form>
        </div>
      )}

      {/* Tab: Tambah Stok */}
      {activeTab === 'stock' && (
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>Tambah Stok Tiket</h2>
          <form onSubmit={handleUpdateStock} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Pilih Event *</label>
              <select style={styles.input} value={stockForm.eventId}
                onChange={e => setStockForm({ ...stockForm, eventId: e.target.value })} required>
                <option value="">-- Pilih Event --</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name} (stok saat ini: {event.available_tickets})
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Jumlah Tiket yang Ditambahkan *</label>
              <input style={styles.input} type="number" min="1" placeholder="cth: 50"
                value={stockForm.additional_tickets}
                onChange={e => setStockForm({ ...stockForm, additional_tickets: e.target.value })} required />
            </div>
            <button type="submit" style={styles.submitBtn}>🎫 Tambah Stok</button>
          </form>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '2rem' },
  title: { color: '#1a1a2e', marginBottom: '1rem' },
  alert: { padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid',
    marginBottom: '1rem', fontWeight: '500' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0' },
  tab: { padding: '0.7rem 1.2rem', background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '0.95rem', color: '#718096', borderBottom: '2px solid transparent', marginBottom: '-2px' },
  activeTab: { color: '#1a1a2e', fontWeight: 'bold', borderBottomColor: '#1a1a2e' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'white',
    borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  thead: { background: '#1a1a2e', color: 'white' },
  th: { padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600' },
  tr: { borderBottom: '1px solid #e2e8f0' },
  td: { padding: '0.9rem 1rem', fontSize: '0.9rem', verticalAlign: 'middle' },
  eventName: { fontWeight: '600', color: '#1a1a2e' },
  venue: { fontSize: '0.8rem', color: '#718096', marginTop: '0.2rem' },
  stockBadge: { padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' },
  deleteBtn: { background: '#fff5f5', color: '#c53030', border: '1px solid #fc8181',
    padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' },
  formCard: { background: 'white', borderRadius: '10px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  formTitle: { color: '#1a1a2e', marginBottom: '1.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  formRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.85rem', fontWeight: '600', color: '#4a5568' },
  input: { padding: '0.7rem', borderRadius: '6px', border: '1px solid #e2e8f0',
    fontSize: '0.95rem', outline: 'none' },
  submitBtn: { padding: '0.8rem', backgroundColor: '#1a1a2e', color: 'white', border: 'none',
    borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold', marginTop: '0.5rem' },
  center: { textAlign: 'center', color: '#718096' }
}

export default Admin