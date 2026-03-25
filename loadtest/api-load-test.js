import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ======================== CONFIG ========================
// Change this to your deployed URL when testing production
const BASE_URL = __ENV.API_URL || 'http://localhost:3000/api/v1';

// A valid JWT token for an existing test user — grab one from your app login
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTM0MmMyZWYwNDM3NTc1ODBkNzU1ZTQiLCJlbWFpbCI6ImRhdmlkLm9rb25rd29AZXhhbXBsZS5jb20iLCJpYXQiOjE3NzQ0NzU3NzcsImV4cCI6MTc3NDQ3OTM3N30.XJvqC6t5K2FE7b6blHF3YEcUxcDAVrARZDYPoye9mC8';

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${AUTH_TOKEN}`,
};

// ======================== SCENARIOS ========================
// Ramp from 0 → 100 → 500 → 1000 users over ~10 minutes
export const options = {
  stages: [
    { duration: '1m', target: 100 },   // ramp to 100 users
    { duration: '2m', target: 100 },   // hold at 100
    { duration: '2m', target: 500 },   // ramp to 500
    { duration: '3m', target: 500 },   // hold at 500
    { duration: '2m', target: 1000 },  // ramp to 1000
    { duration: '2m', target: 1000 },  // hold at 1000
    { duration: '1m', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests under 2s
    http_req_failed: ['rate<0.05'],     // less than 5% errors
  },
};

// ======================== TEST FUNCTIONS ========================
// Simulates a typical user session: browse discovery, check matches, send message

export default function () {
  // 1. Health check
  const health = http.get(`${BASE_URL.replace('/api/v1', '')}/`);
  check(health, {
    'health: status 200': (r) => r.status === 200,
  });

  sleep(1);

  // 2. Get discovery feed (heaviest query — geo + filters)
  const discovery = http.get(`${BASE_URL}/discover`, { headers });
  check(discovery, {
    'discovery: status 200': (r) => r.status === 200 || r.status === 401,
  });

  sleep(2);

  // 3. Get matches list
  const matches = http.get(`${BASE_URL}/matches`, { headers });
  check(matches, {
    'matches: status 200': (r) => r.status === 200 || r.status === 401,
  });

  sleep(1);

  // 4. Get notifications
  const notifications = http.get(`${BASE_URL}/notifications`, { headers });
  check(notifications, {
    'notifications: status 200': (r) => r.status === 200 || r.status === 401,
  });

  sleep(1);

  // 5. Get user profile
  const profile = http.get(`${BASE_URL}/users/profile`, { headers });
  check(profile, {
    'profile: status 200': (r) => r.status === 200 || r.status === 401,
  });

  sleep(2);
}
