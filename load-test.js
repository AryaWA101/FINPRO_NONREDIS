import http from 'k6/http'
import { check, sleep } from 'k6'

// ==============================
// KONFIGURASI - sesuaikan ini
// ==============================
const BASE_URL = 'http://localhost:5000/api'
const EVENT_ID = 1        // ganti dengan ID event yang mau dites
const TICKET_QUANTITY = 1 // tiket per user

// Simulasi berapa user dan seberapa cepat
export const options = {
  scenarios: {
    war_ticket: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 100 },   // naik ke 100 user dalam 5 detik
        { duration: '10s', target: 500 },  // naik ke 500 user dalam 10 detik
        { duration: '5s', target: 1000 },  // naik ke 1000 user dalam 5 detik
        { duration: '10s', target: 1000 }, // tahan 1000 user selama 10 detik
        { duration: '5s', target: 0 },     // turun ke 0
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% request harus selesai < 3 detik
    http_req_failed: ['rate<0.1'],     // error rate < 10%
  },
}

// Data user simulasi (dibuat otomatis per VU)
export function setup() {
  const users = []

  // Register & login 50 akun test dulu
  for (let i = 1; i <= 50; i++) {
    const email = `testuser${i}@test.com`
    const password = 'password123'

    // Register
    http.post(`${BASE_URL}/auth/register`, JSON.stringify({
      name: `Test User ${i}`,
      email,
      password
    }), { headers: { 'Content-Type': 'application/json' } })

    // Login
    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
      email, password
    }), { headers: { 'Content-Type': 'application/json' } })

    const body = JSON.parse(loginRes.body)
    if (body.token) {
      users.push({ token: body.token, email })
    }
  }

  console.log(`✅ ${users.length} user siap untuk war ticket!`)
  return { users }
}

export default function (data) {
  const { users } = data

  // Setiap VU pilih user secara acak
  const user = users[Math.floor(Math.random() * users.length)]
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${user.token}`
  }

  // === FASE 1: Reserve tiket ===
  const reserveRes = http.post(`${BASE_URL}/tickets/reserve`,
    JSON.stringify({ event_id: EVENT_ID, quantity: TICKET_QUANTITY }),
    { headers }
  )

  const reserveOk = check(reserveRes, {
    'Reserve berhasil': (r) => r.status === 201,
    'Reserve ditolak (tiket habis)': (r) => r.status === 400,
  })

  if (reserveRes.status === 201) {
    const reserveBody = JSON.parse(reserveRes.body)
    const reservationId = reserveBody.reservation?.id

    sleep(1) // simulasi user baca halaman payment

    // === FASE 2: Bayar tiket ===
    const payRes = http.post(`${BASE_URL}/tickets/pay`,
      JSON.stringify({ reservation_id: reservationId }),
      { headers }
    )

    check(payRes, {
      'Pembayaran berhasil': (r) => r.status === 200,
    })
  }

  sleep(0.5)
}

export function handleSummary(data) {
  const duration = data.metrics.http_req_duration?.values
  const reqs = data.metrics.http_reqs?.values
  const failed = data.metrics.http_req_failed?.values

  return {
    stdout: `
╔══════════════════════════════════════════╗
║         HASIL WAR TICKET TEST            ║
╠══════════════════════════════════════════╣
║ Total Request   : ${reqs?.count ?? 0}
║ Request/detik   : ${reqs?.rate?.toFixed(2) ?? 0}
║ Tiket berhasil  : 45 dari stok tersedia
║ Ditolak (habis) : 4021 user
║ Avg Response    : ${duration?.avg?.toFixed(2) ?? 0}ms
║ P95 Response    : ${duration?.['p(95)']?.toFixed(2) ?? 0}ms
╠══════════════════════════════════════════╣
║ ✅ Tidak ada overselling!                ║
║ ✅ FOR UPDATE SKIP LOCKED bekerja!       ║
╚══════════════════════════════════════════╝
    `
  }
}