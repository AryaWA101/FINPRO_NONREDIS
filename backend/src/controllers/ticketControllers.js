const {
  createReservationService,
  processPaymentService,
  cancelReservationService,
  getMyReservationsService
} = require('../services/ticketService')
const pool = require('../db')

const reserveTicket = async (req, res) => {
  const { event_id, quantity } = req.body
  const user_id = req.user.id

  if (!quantity || quantity < 1 || quantity > 10) {
    return res.status(400).json({ message: 'Jumlah tiket harus antara 1-10' })
  }

  try {
    const result = await createReservationService(event_id, user_id, quantity)
    if (!result.success) return res.status(400).json({ message: result.message })
    res.status(201).json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

const payTicket = async (req, res) => {
  const { reservation_id } = req.body
  const user_id = req.user.id

  try {
    const result = await processPaymentService(reservation_id, user_id)
    if (!result.success) return res.status(400).json({ message: result.message })
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

const cancelTicket = async (req, res) => {
  const { reservation_id } = req.body
  const user_id = req.user.id

  try {
    const result = await cancelReservationService(reservation_id, user_id)
    if (!result.success) return res.status(400).json({ message: result.message })
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

const getMyTickets = async (req, res) => {
  const user_id = req.user.id
  try {
    const result = await pool.query(
      `SELECT 
        t.id as booking_id,
        t.quantity,
        t.total_price,
        t.purchased_at,
        e.name as event_name,
        e.date,
        e.venue,
        e.price,
        json_agg(
          json_build_object('id', ti.id, 'code', ti.ticket_code)
          ORDER BY ti.id
        ) as ticket_items
       FROM tickets t
       JOIN events e ON t.event_id = e.id
       JOIN ticket_items ti ON ti.ticket_id = t.id
       WHERE t.user_id = $1
       GROUP BY t.id, e.name, e.date, e.venue, e.price
       ORDER BY t.purchased_at DESC`,
      [user_id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

const getMyReservations = async (req, res) => {
  const user_id = req.user.id
  try {
    const result = await getMyReservationsService(user_id)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { reserveTicket, payTicket, cancelTicket, getMyTickets, getMyReservations }