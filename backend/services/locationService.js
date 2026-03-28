const axios = require('axios');

const getCountryAndCurrency = async (placeName) => {
    try {
        // 1. Geocode place name to get country code (ISO 3166-1 alpha-2)
        // Using Nominatim (OpenStreetMap)
        const geoResponse = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName)}&format=json&addressdetails=1&limit=1`, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://google.com'
            },
            timeout: 15000
        });

        if (!geoResponse.data || geoResponse.data.length === 0) {
            throw new Error('Location not found');
        }

        const address = geoResponse.data[0].address;
        const countryCode = address.country_code.toUpperCase();
        const countryName = address.country;
        const resolvedName = geoResponse.data[0].display_name.split(',')[0];
        
        // Extract parent city/town for broader landmark search
        const parentLocation = address.city || address.town || address.village || address.municipality || address.county || countryName;

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
            resolvedName,
            parentLocation,
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
            timeout: 25000
        });
        return response.data.map(item => ({
            display_name: item.display_name,
            name: item.name
        }));
    } catch (error) {
        console.error('Search Error:', error.message);
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            console.log('Retrying with alternative strategy after delay...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
                const retryResponse = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`, {
                    headers: { 'User-Agent': 'TravelPlannerBot/1.1 (https://example.com/bot; bot@example.com)' },
                    timeout: 25000
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
        const categories = [
            'tourist attraction', 'museum', 'monument', 'viewpoint', 
            'castle', 'palace', 'church', 'temple', 'cathedral', 
            'historic site', 'national park', 'beach', 'landmark'
        ];
        
        const results = await Promise.all(categories.map(cat => 
            axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cat + ' in ' + destination)}&format=json&limit=15&addressdetails=1`, {
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
                timeout: 30000
            }).catch(() => ({ data: [] }))
        ));
        
        let allLandmarks = results.flatMap(r => r.data);
        
        if (allLandmarks.length < 15) {
            const broaderResponse = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent('tourism in ' + destination)}&format=json&limit=40&addressdetails=1`, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 20000
            }).catch(() => ({ data: [] }));
            allLandmarks = [...allLandmarks, ...broaderResponse.data];
        }

        if (allLandmarks.length === 0) return [];
        
        const blacklist = [
            'road', 'highway', 'street', 'station', 'stop', 'bus', 'train', 'metro', 'airport', 
            'school', 'university', 'office', 'company', 'shop', 'mall', 'bank', 'fuel', 
            'residential', 'apartment', 'hospital', 'atm', 'parking', 'garage',
            'hotel', 'motel', 'hostel', 'resort', 'lodge', 'villas', 'guest house', 'bed & breakfast',
            'restaurant', 'cafe', 'bar', 'pharmacy'
        ];

        const seen = new Set();
        return allLandmarks
            .sort((a, b) => (b.importance || 0) - (a.importance || 0))
            .filter(item => {
                const fullName = item.display_name.toLowerCase();
                const firstName = item.display_name.split(',')[0];
                const itemClass = item.class || '';
                const itemType = item.type || '';
                
                if (seen.has(firstName)) return false;
                if (firstName.length < 3) return false;

                const isBlacklisted = blacklist.some(word => fullName.includes(word) || itemClass.includes(word) || itemType.includes(word));
                
                // Prioritize tourism, historic, and heritage classes
                const isTouristClass = ['tourism', 'historic', 'heritage', 'amenity', 'leisure', 'natural'].includes(itemClass);
                
                if (!isBlacklisted && (item.importance > 0.4 || isTouristClass)) {
                    seen.add(firstName);
                    return true;
                }
                return false;
            })
            .map(item => ({
                name: item.display_name.split(',')[0],
                address: item.display_name,
                type: item.type,
                class: item.class,
                importance: item.importance,
                lat: item.lat,
                lon: item.lon
            }));
    } catch (error) {
        console.error('Landmark Search Error:', error.message);
        return [];
    }
};

module.exports = { getCountryAndCurrency, searchLocations, getLandmarks };
