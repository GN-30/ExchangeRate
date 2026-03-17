const axios = require('axios');

const getCountryAndCurrency = async (placeName) => {
    try {
        // 1. Geocode place name to get country code (ISO 3166-1 alpha-2)
        // Using Nominatim (OpenStreetMap)
        const geoResponse = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName)}&format=json&addressdetails=1&limit=1`, {
            headers: { 
                'User-Agent': 'AI-Travel-Planner-App',
                'Accept': 'application/json',
                'Connection': 'keep-alive'
            },
            timeout: 10000
        });

        if (!geoResponse.data || geoResponse.data.length === 0) {
            throw new Error('Location not found');
        }

        const address = geoResponse.data[0].address;
        const countryCode = address.country_code.toUpperCase();
        const countryName = address.country;

        // 2. Get currency from country code
        // Using RestCountries API
        const countryResponse = await axios.get(`https://restcountries.com/v3.1/alpha/${countryCode}`);
        
        if (!countryResponse.data || countryResponse.data.length === 0) {
            throw new Error('Country details not found');
        }

        const countryData = countryResponse.data[0];
        const currencies = countryData.currencies;
        const currencyCode = Object.keys(currencies)[0];
        const currencySymbol = currencies[currencyCode].symbol || currencyCode;

        return {
            countryCode,
            countryName,
            currencyCode,
            currencySymbol,
            isIndia: countryCode === 'IN'
        };
    } catch (error) {
        console.error('Location Resolution Error:', error.message);
        // Fallback to India if search fails or is specific to India
        if (placeName.toLowerCase().includes('india')) {
            return { countryCode: 'IN', countryName: 'India', currencyCode: 'INR', isIndia: true };
        }
        throw error;
    }
};

const searchLocations = async (query) => {
    try {
        // High-quality headers to avoid bot detection/resets
        const response = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://google.com'
            },
            timeout: 15000
        });
        return response.data.map(item => ({
            display_name: item.display_name,
            name: item.name
        }));
    } catch (error) {
        console.error('Search Error:', error.message);
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            console.log('Retrying with alternative strategy...');
            try {
                // Secondary check using a different UA or slightly different endpoint if needed
                const retryResponse = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`, {
                    headers: { 'User-Agent': 'TravelPlannerBot/1.0 (contact@example.com)' }
                });
                return retryResponse.data.map(item => ({
                    display_name: item.display_name,
                    name: item.name
                }));
            } catch (retryErr) {
                return [];
            }
        }
        return [];
    }
};

const getLandmarks = async (destination) => {
    try {
        // Multi-category search for variety
        const queries = [`attractions in ${destination}`, `museums in ${destination}`, `parks in ${destination}`];
        const results = await Promise.all(queries.map(q => 
            axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=8`, {
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
                timeout: 15000
            }).catch(() => ({ data: [] }))
        ));
        
        const allLandmarks = results.flatMap(r => r.data);
        if (allLandmarks.length === 0) return [];
        
        // Remove duplicates and clean up names
        const seen = new Set();
        return allLandmarks
            .filter(item => {
                const name = item.display_name.split(',')[0];
                if (seen.has(name)) return false;
                seen.add(name);
                return true;
            })
            .map(item => ({
                name: item.display_name.split(',')[0],
                address: item.display_name
            }));
    } catch (error) {
        console.error('Landmark Search Error:', error.message);
        return [];
    }
};

module.exports = { getCountryAndCurrency, searchLocations, getLandmarks };
