const jwt = require('jsonwebtoken')
const pool = require('../db')
require('dotenv').config()

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Cek is_admin dari database
    const result = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1', [decoded.id]
    )
    
    if (!result.rows[0]?.is_admin) {
      return res.status(403).json({ message: 'Akses ditolak, bukan admin' })
    }

    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Token tidak valid' })
  }
}