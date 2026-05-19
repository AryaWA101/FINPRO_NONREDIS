const pool = require('../db')

// Lepas tiket yang reservasinya expired
const releaseExpiredReservations = async (client) => {
  await client.query(`
    UPDATE events e
    SET available_tickets = e.available_tickets + r.quantity
    FROM reservations r
    WHERE r.event_id = e.id
      AND r.status = 'pending'
      AND r.expires_at < NOW()
  `)
  await client.query(`
    UPDATE reservations SET status = 'expired'
    WHERE status = 'pending' AND expires_at < NOW()
  `)
}

// Buat reservasi (tahan tiket sementara)
const createReservationService = async (eventId, userId, quantity) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await releaseExpiredReservations(client)

    // Lock & cek ketersediaan tiket
    const eventResult = await client.query(
      `SELECT * FROM events
       WHERE id = $1 AND available_tickets >= $2
       FOR UPDATE SKIP LOCKED`,
      [eventId, quantity]
    )

    if (eventResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return { success: false, message: 'Tiket tidak cukup tersedia' }
    }

    const event = eventResult.rows[0]

    // Cek reservasi aktif yang sudah ada
    const existingReservation = await client.query(
      `SELECT id FROM reservations
       WHERE event_id = $1 AND user_id = $2
         AND status = 'pending' AND expires_at > NOW()`,
      [eventId, userId]
    )
    if (existingReservation.rows.length > 0) {
      await client.query('ROLLBACK')
      return { success: false, message: 'Kamu sudah punya reservasi aktif untuk event ini' }
    }

    // Cek sudah pernah beli
    const existingTicket = await client.query(
      `SELECT id FROM tickets WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    )
    if (existingTicket.rows.length > 0) {
      await client.query('ROLLBACK')
      return { success: false, message: 'Kamu sudah membeli tiket untuk event ini' }
    }

    const totalPrice = event.price * quantity
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 menit

    // Kurangi stok
    await client.query(
      `UPDATE events SET available_tickets = available_tickets - $1 WHERE id = $2`,
      [quantity, eventId]
    )

    // Buat reservasi
    const reservation = await client.query(
      `INSERT INTO reservations (event_id, user_id, quantity, total_price, status, expires_at)
       VALUES ($1, $2, $3, $4, 'pending', $5) RETURNING *`,
      [eventId, userId, quantity, totalPrice, expiresAt]
    )

    await client.query('COMMIT')
    return {
      success: true,
      message: 'Reservasi berhasil! Selesaikan pembayaran dalam 10 menit.',
      reservation: reservation.rows[0],
      event: { name: event.name, date: event.date, venue: event.venue, price: event.price }
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// Proses pembayaran
const processPaymentService = async (reservationId, userId) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const result = await client.query(
      `SELECT r.*, e.name as event_name, e.date, e.venue
       FROM reservations r
       JOIN events e ON r.event_id = e.id
       WHERE r.id = $1 AND r.user_id = $2
       FOR UPDATE`,
      [reservationId, userId]
    )

    if (result.rows.length === 0) {
      await client.query('ROLLBACK')
      return { success: false, message: 'Reservasi tidak ditemukan' }
    }

    const reservation = result.rows[0]

    if (reservation.status === 'expired' || new Date(reservation.expires_at) < new Date()) {
      await client.query(
        `UPDATE events SET available_tickets = available_tickets + $1 WHERE id = $2`,
        [reservation.quantity, reservation.event_id]
      )
      await client.query(`UPDATE reservations SET status = 'expired' WHERE id = $1`, [reservationId])
      await client.query('COMMIT')
      return { success: false, message: 'Reservasi sudah expired, silakan pesan ulang' }
    }

    if (reservation.status !== 'pending') {
      await client.query('ROLLBACK')
      return { success: false, message: `Reservasi sudah ${reservation.status}` }
    }

    await client.query(`UPDATE reservations SET status = 'paid' WHERE id = $1`, [reservationId])

    // Insert 1 record ticket (sebagai booking/order)
    const ticket = await client.query(
      `INSERT INTO tickets (event_id, user_id, status, quantity, total_price, reservation_id)
       VALUES ($1, $2, 'sold', $3, $4, $5) RETURNING *`,
      [reservation.event_id, userId, reservation.quantity, reservation.total_price, reservationId]
    )

    const ticketId = ticket.rows[0].id

    // ← TAMBAHAN BARU: Generate individual ticket item untuk setiap tiket
    const ticketCodes = []
    for (let i = 0; i < reservation.quantity; i++) {
      const ticketCode = `TW-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      await client.query(
        `INSERT INTO ticket_items (ticket_id, event_id, user_id, ticket_code)
         VALUES ($1, $2, $3, $4)`,
        [ticketId, reservation.event_id, userId, ticketCode]
      )
      ticketCodes.push(ticketCode)
    }

    await client.query('COMMIT')
    return {
      success: true,
      message: 'Pembayaran berhasil! Tiket kamu sudah dikonfirmasi.',
      ticket: ticket.rows[0],
      ticket_codes: ticketCodes,
      event: { name: reservation.event_name, date: reservation.date, venue: reservation.venue }
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// Batalkan reservasi
const cancelReservationService = async (reservationId, userId) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const result = await client.query(
      `SELECT * FROM reservations
       WHERE id = $1 AND user_id = $2 AND status = 'pending'
       FOR UPDATE`,
      [reservationId, userId]
    )

    if (result.rows.length === 0) {
      await client.query('ROLLBACK')
      return { success: false, message: 'Reservasi tidak ditemukan atau sudah tidak aktif' }
    }

    const reservation = result.rows[0]

    await client.query(
      `UPDATE events SET available_tickets = available_tickets + $1 WHERE id = $2`,
      [reservation.quantity, reservation.event_id]
    )
    await client.query(`UPDATE reservations SET status = 'cancelled' WHERE id = $1`, [reservationId])

    await client.query('COMMIT')
    return { success: true, message: 'Reservasi dibatalkan, tiket dikembalikan ke stok' }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

const getMyReservationsService = async (userId) => {
  const result = await pool.query(
    `SELECT r.*, e.name as event_name, e.date, e.venue, e.price
     FROM reservations r
     JOIN events e ON r.event_id = e.id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC`,
    [userId]
  )
  return result.rows
}

module.exports = {
  createReservationService,
  processPaymentService,
  cancelReservationService,
  getMyReservationsService
}