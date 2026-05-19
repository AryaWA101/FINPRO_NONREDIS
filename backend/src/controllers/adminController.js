const pool = require('../db')

// GET semua events dengan statistik
const getAllEvents = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.*,
        COUNT(t.id) as total_sold,
        COALESCE(SUM(t.total_price), 0) as total_revenue
      FROM events e
      LEFT JOIN tickets t ON t.event_id = e.id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST tambah event baru
const createEvent = async (req, res) => {
  const { name, description, date, venue, price, total_tickets } = req.body

  if (!name || !date || !venue || !price || !total_tickets) {
    return res.status(400).json({ message: 'Semua field wajib diisi' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO events (name, description, date, venue, price, total_tickets, available_tickets)
       VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING *`,
      [name, description, date, venue, price, total_tickets]
    )
    res.status(201).json({ message: 'Event berhasil ditambahkan', event: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// PATCH update stok tiket
const updateTicketStock = async (req, res) => {
  const { id } = req.params
  const { additional_tickets } = req.body

  if (!additional_tickets || additional_tickets < 1) {
    return res.status(400).json({ message: 'Jumlah tiket harus lebih dari 0' })
  }

  try {
    const result = await pool.query(
      `UPDATE events 
       SET available_tickets = available_tickets + $1,
           total_tickets = total_tickets + $1
       WHERE id = $2
       RETURNING *`,
      [additional_tickets, id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event tidak ditemukan' })
    }
    res.json({ message: 'Stok tiket berhasil diupdate', event: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// DELETE hapus event
const deleteEvent = async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM events WHERE id = $1', [id])
    res.json({ message: 'Event berhasil dihapus' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getAllEvents, createEvent, updateTicketStock, deleteEvent }