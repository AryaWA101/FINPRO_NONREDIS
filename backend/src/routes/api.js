const express = require('express')
const router = express.Router()

const authController = require('../controllers/authControllers')
const eventController = require('../controllers/eventControllers')
const ticketController = require('../controllers/ticketControllers')
const adminController = require('../controllers/adminController')
const auth = require('../middleware/auth')
const adminAuth = require('../middleware/adminAuth')

// Auth
router.post('/auth/register', authController.register)
router.post('/auth/login', authController.login)

// Events (public)
router.get('/events', eventController.getAllEvents)
router.get('/events/:id', eventController.getEventById)

// Tickets & Reservations (protected)
router.post('/tickets/reserve', auth, ticketController.reserveTicket)
router.post('/tickets/pay', auth, ticketController.payTicket)
router.post('/tickets/cancel', auth, ticketController.cancelTicket)
router.get('/tickets/my', auth, ticketController.getMyTickets)
router.get('/tickets/reservations', auth, ticketController.getMyReservations)

// Admin (protected + admin only)
router.get('/admin/events', adminAuth, adminController.getAllEvents)
router.post('/admin/events', adminAuth, adminController.createEvent)
router.patch('/admin/events/:id/stock', adminAuth, adminController.updateTicketStock)
router.delete('/admin/events/:id', adminAuth, adminController.deleteEvent)

module.exports = router