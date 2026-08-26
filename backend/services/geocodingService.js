const axios = require('axios');

const cache = new Map(); // In-memory cache

const resolveDestination = async (placeName) => {
    if (!placeName) return null;
    const cleanQuery = placeName.trim().toLowerCase();
    if (cache.has(cleanQuery)) {
        console.log(`[Geocoding] Cache hit for: ${placeName}`);
        return cache.get(cleanQuery);
    }

    const apiKey = (process.env.GOOGLE_MAPS_API_KEY || "").trim();
    if (apiKey && apiKey !== "your_api_key_here") {
        try {
            console.log(`[Geocoding] Using Google Geocoding API for: ${placeName}`);
            const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
                params: { address: placeName, key: apiKey },
                timeout: 10000
            });
            if (response.data.status === 'OK' && response.data.results.length > 0) {
                const result = response.data.results[0];
                const { lat, lng } = result.geometry.location;
                const countryComponent = result.address_components.find(c => c.types.includes('country'));
                const country = countryComponent ? countryComponent.long_name : 'Unknown';
                const resolved = {
                    name: result.formatted_address.split(',')[0],
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lng),
                    country: country,
                    formattedAddress: result.formatted_address
                };
                cache.set(cleanQuery, resolved);
                return resolved;
            }
        } catch (error) {
            console.error('[Geocoding] Google API Error:', error.message);
        }
    }

    // Fallback: Nominatim
    try {
        console.log(`[Geocoding] Using Nominatim fallback for: ${placeName}`);
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: { q: placeName, format: 'json', addressdetails: 1, limit: 1 },
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });
        if (response.data && response.data.length > 0) {
            const data = response.data[0];
            const country = data.address.country || 'Unknown';
            const resolved = {
                name: data.display_name.split(',')[0],
                latitude: parseFloat(data.lat),
                longitude: parseFloat(data.lon),
                country: country,
                formattedAddress: data.display_name
            };
            cache.set(cleanQuery, resolved);
            return resolved;
        }
    } catch (error) {
        console.error('[Geocoding] Nominatim Fallback Error:', error.message);
    }

    return null;
};

module.exports = { resolveDestination };
