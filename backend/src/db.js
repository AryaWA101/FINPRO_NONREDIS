const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false   // ← false kalau koneksi lokal, true kalau Neon
})

pool.connect()
  .then(() => console.log('Database connected!'))
  .catch(err => console.error('Database connection error:', err.message))

module.exports = pool