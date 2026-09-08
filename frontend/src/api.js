// Central API base URL — reads from VITE_API_URL env var in production,
// falls back to localhost:5000 during local development.
const API_BASE = import.meta.env.VITE_API_URL || 'https://exchangerate-3u3j.onrender.com';

export default API_BASE;
