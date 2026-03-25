import { check } from 'k6';
import ws from 'k6/ws';
import { sleep } from 'k6';

// ======================== CONFIG ========================
const WS_URL = __ENV.WS_URL || 'ws://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTM0MmMyZWYwNDM3NTc1ODBkNzU1ZTQiLCJlbWFpbCI6ImRhdmlkLm9rb25rd29AZXhhbXBsZS5jb20iLCJpYXQiOjE3NzQ0NzU3NzcsImV4cCI6MTc3NDQ3OTM3N30.XJvqC6t5K2FE7b6blHF3YEcUxcDAVrARZDYPoye9mC8';

// Ramp WebSocket connections: 0 → 200 → 500
export const options = {
  stages: [
    { duration: '1m', target: 200 },
    { duration: '3m', target: 200 },
    { duration: '2m', target: 500 },
    { duration: '3m', target: 500 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    ws_connecting: ['p(95)<5000'],  // 95% connect under 5s
  },
};

export default function () {
  // Socket.IO uses Engine.IO transport — connect via polling first, then upgrade
  // k6 ws module connects raw WebSocket, so we use the Engine.IO path
  const url = `${WS_URL}/socket.io/?EIO=4&transport=websocket&token=${AUTH_TOKEN}`;

  const res = ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      // Send Socket.IO handshake (Engine.IO protocol)
      // Packet type 0 = CONNECT for Socket.IO namespace
      socket.send('40');
    });

    socket.on('message', (msg) => {
      // Socket.IO sends "40" back as connection ack
      if (msg === '40') {
        // Connected! Now simulate presence ping
        socket.send('42["presence:ping"]');
      }

      // Respond to Engine.IO ping (type 2) with pong (type 3)
      if (msg === '2') {
        socket.send('3');
      }
    });

    // Keep connection alive for 30-60 seconds (simulates real user session)
    sleep(30 + Math.random() * 30);

    socket.close();
  });

  check(res, {
    'ws: connected successfully': (r) => r && r.status === 101,
  });
}
