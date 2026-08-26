// Central API base URL — reads from VITE_API_URL env var in production,
// falls back to localhost:5000 during local development.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default API_BASE;
