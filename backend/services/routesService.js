const axios = require('axios');
const { calculateHaversineDistance, estimateTravelTimeMinutes } = require('../utils/distanceCalculator');

const cache = new Map(); // Simple routing cache

const getRoute = async (lat1, lon1, lat2, lon2) => {
    // If coordinates are virtually identical, distance is zero
    if (Math.abs(lat1 - lat2) < 0.0001 && Math.abs(lon1 - lon2) < 0.0001) {
        return { distanceKm: 0, durationMinutes: 0 };
    }

    const key = `${lat1.toFixed(4)},${lon1.toFixed(4)}->${lat2.toFixed(4)},${lon2.toFixed(4)}`;
    if (cache.has(key)) {
        return cache.get(key);
    }

    const googleKey = (process.env.GOOGLE_MAPS_API_KEY || "").trim();
    
    // Primary: Google Distance Matrix
    if (googleKey && googleKey !== "your_api_key_here") {
        try {
            console.log(`[Routes] Using Google Distance Matrix API...`);
            const response = await axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json`, {
                params: {
                    origins: `${lat1},${lon1}`,
                    destinations: `${lat2},${lon2}`,
                    key: googleKey
                },
                timeout: 5000
            });
            if (response.data.status === 'OK' && response.data.rows[0].elements[0].status === 'OK') {
                const element = response.data.rows[0].elements[0];
                const distanceKm = parseFloat((element.distance.value / 1000).toFixed(2));
                const durationMinutes = Math.round(element.duration.value / 60);
                const route = { distanceKm, durationMinutes };
                cache.set(key, route);
                return route;
            }
        } catch (error) {
            console.error('[Routes] Google Distance Matrix Error:', error.message);
        }
    }

    // Fallback 1: OSRM Public Routing
    try {
        console.log(`[Routes] Using OSRM routing API fallback...`);
        const response = await axios.get(`https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}`, {
            params: { overview: 'false' },
            timeout: 5000
        });
        if (response.data && response.data.routes && response.data.routes.length > 0) {
            const routeObj = response.data.routes[0];
            const distanceKm = parseFloat((routeObj.distance / 1000).toFixed(2));
            const durationMinutes = Math.round(routeObj.duration / 60);
            const route = { distanceKm, durationMinutes };
            cache.set(key, route);
            return route;
        }
    } catch (error) {
        console.error('[Routes] OSRM Fallback Error:', error.message);
    }

    // Fallback 2: Haversine
    const distanceKm = calculateHaversineDistance(lat1, lon1, lat2, lon2);
    const durationMinutes = estimateTravelTimeMinutes(distanceKm);
    console.log(`[Routes] Using Haversine math fallback: ${distanceKm} km, ${durationMinutes} mins`);
    const route = { distanceKm, durationMinutes };
    cache.set(key, route);
    return route;
};

module.exports = { getRoute };
