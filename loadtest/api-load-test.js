import http from 'k6/http';
import { check, sleep, group } from 'k6';

// ======================== CONFIG ========================
const BASE_URL = __ENV.API_URL || 'http://localhost:3000/api/v1';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTM0MmMyZWYwNDM3NTc1ODBkNzU1ZTQiLCJlbWFpbCI6ImRhdmlkLm9rb25rd29AZXhhbXBsZS5jb20iLCJpYXQiOjE3NzQ1MTkyNDcsImV4cCI6MTc3NDUyMjg0N30.__9ZZV5TbL1DCdChlfUbCxV9XF58sUr9kUJfZoMeGvU';

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${AUTH_TOKEN}`,
};

// ======================== SCENARIOS ========================
export const options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 500 },
    { duration: '3m', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '2m', target: 1000 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

// ======================== USER FLOWS ========================
const flows = [browseFlow, socialFlow, messagingFlow, profileFlow, propertyFlow];
const weights = [0.30, 0.50, 0.70, 0.85, 1.0];

export default function () {
  const rand = Math.random();
  const flowIndex = weights.findIndex(w => rand < w);
  flows[flowIndex]();
}

// ======================== FLOW: BROWSE (30%) ========================
function browseFlow() {
  group('browse', () => {
    const health = http.get(`${BASE_URL}/health`);
    check(health, { 'health: 200': (r) => r.status === 200 });
    sleep(0.5);

    const home = http.get(`${BASE_URL}/home/feed`, { headers });
    check(home, { 'home feed: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    const discover = http.get(`${BASE_URL}/discover`, { headers });
    check(discover, { 'discover: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(2);

    const feed = http.get(`${BASE_URL}/matches/feed`, { headers });
    check(feed, { 'matches feed: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    const matches = http.get(`${BASE_URL}/matches`, { headers });
    check(matches, { 'matches: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    const notif = http.get(`${BASE_URL}/notifications`, { headers });
    check(notif, { 'notifications: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);
  });
}

// ======================== FLOW: SOCIAL (20%) ========================
function socialFlow() {
  group('social', () => {
    // Events - nearby
    const events = http.get(`${BASE_URL}/events/upcoming`, { headers });
    check(events, { 'events: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    // Study buddy categories
    const study = http.get(`${BASE_URL}/study-buddy`, { headers });
    check(study, { 'study buddy: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    // Clans list
    const clans = http.get(`${BASE_URL}/clans`, { headers });
    check(clans, { 'clans: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    // Active challenges
    const challenges = http.get(`${BASE_URL}/challenges`, { headers });
    check(challenges, { 'challenges: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    // Games list
    const games = http.get(`${BASE_URL}/games`, { headers });
    check(games, { 'games: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    // Discovery
    const discover = http.get(`${BASE_URL}/discover`, { headers });
    check(discover, { 'discover: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);
  });
}

// ======================== FLOW: MESSAGING (20%) ========================
function messagingFlow() {
  group('messaging', () => {
    const matches = http.get(`${BASE_URL}/matches`, { headers });
    check(matches, { 'matches: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    const notif = http.get(`${BASE_URL}/notifications`, { headers });
    check(notif, { 'notifications: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    // Notifications again (polling behavior)
    const notif2 = http.get(`${BASE_URL}/notifications`, { headers });
    check(notif2, { 'notifications poll: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(2);

    const profile = http.get(`${BASE_URL}/users/me`, { headers });
    check(profile, { 'profile: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    // Matches feed
    const feed = http.get(`${BASE_URL}/matches/feed`, { headers });
    check(feed, { 'matches feed: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);
  });
}

// ======================== FLOW: PROFILE (15%) ========================
function profileFlow() {
  group('profile', () => {
    const me = http.get(`${BASE_URL}/users/me`, { headers });
    check(me, { 'my profile: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    const completion = http.get(`${BASE_URL}/users/me/completion`, { headers });
    check(completion, { 'completion: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    // Points stats
    const points = http.get(`${BASE_URL}/points/stats`, { headers });
    check(points, { 'points: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    // Points config
    const config = http.get(`${BASE_URL}/points/config`, { headers });
    check(config, { 'points config: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    // Notification settings
    const settings = http.get(`${BASE_URL}/users/settings/notifications`, { headers });
    check(settings, { 'notif settings: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    // Privacy settings
    const privacy = http.get(`${BASE_URL}/users/settings/privacy`, { headers });
    check(privacy, { 'privacy settings: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    // Premium status
    const premium = http.get(`${BASE_URL}/premium/status`, { headers });
    check(premium, { 'premium: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    // Swipe limit check
    const swipe = http.get(`${BASE_URL}/premium/swipe-limit`, { headers });
    check(swipe, { 'swipe limit: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);
  });
}

// ======================== FLOW: PROPERTY (15%) ========================
function propertyFlow() {
  group('property', () => {
    // Search properties
    const props = http.get(`${BASE_URL}/properties/search`, { headers });
    check(props, { 'properties search: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(2);

    // Liked properties
    const liked = http.get(`${BASE_URL}/properties/liked`, { headers });
    check(liked, { 'liked properties: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    // My roommate connections
    const roommates = http.get(`${BASE_URL}/roommates`, { headers });
    check(roommates, { 'roommates: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    // Roommate groups
    const groups = http.get(`${BASE_URL}/roommate-groups`, { headers });
    check(groups, { 'roommate groups: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    // Pending reviews
    const reviews = http.get(`${BASE_URL}/reviews/pending`, { headers });
    check(reviews, { 'reviews: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);

    // Discovery
    const discover = http.get(`${BASE_URL}/discover`, { headers });
    check(discover, { 'discover: ok': (r) => r.status === 200 || r.status === 401 });
    sleep(1);
  });
}
