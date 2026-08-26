const axios = require('axios');

const cache = new Map(); // Simple in-memory cache

const INTEREST_MAPPING = {
    nature: { google: 'waterfall, nature reserve, state park, national park, hiking area', osm: ['waterfall', 'nature reserve', 'national park', 'forest'] },
    historical: { google: 'historic site, monument, castle, ruins, museum', osm: ['historic site', 'monument', 'castle', 'ruins'] },
    adventure: { google: 'amusement park, adventure sports, theme park, zoo', osm: ['amusement park', 'adventure', 'theme park', 'zoo'] },
    beaches: { google: 'beach, lake, seaside', osm: ['beach', 'lake', 'coast'] },
    temples: { google: 'temple, church, mosque, shrine, place of worship', osm: ['temple', 'church', 'mosque', 'shrine'] },
    shopping: { google: 'shopping mall, marketplace, flea market', osm: ['shopping mall', 'market', 'bazaar'] },
    food: { google: 'restaurant, cafe, bakery, food court', osm: ['restaurant', 'cafe', 'bakery'] },
    museums: { google: 'museum, art gallery, science center', osm: ['museum', 'art gallery'] },
    nightlife: { google: 'bar, pub, night club', osm: ['bar', 'pub', 'nightclub'] },
    photography: { google: 'scenic viewpoint, observation deck, landmark', osm: ['viewpoint', 'scenic spot', 'landmark'] }
};

const searchPlaces = async (destination, latitude, longitude, interests = [], budget = 50000) => {
    const cacheKey = `${latitude},${longitude},${interests.sort().join(',')}`;
    if (cache.has(cacheKey)) {
        console.log(`[Places] Cache hit for coordinates: ${latitude}, ${longitude}`);
        return cache.get(cacheKey);
    }

    const apiKey = (process.env.GOOGLE_MAPS_API_KEY || "").trim();
    let candidates = [];

    const activeInterests = interests.length > 0 ? interests : ['nature', 'historical', 'photography'];
    
    if (apiKey && apiKey !== "your_api_key_here") {
        try {
            console.log(`[Places] Using Google Places API for destination: ${destination}`);
            
            const searchPromises = activeInterests.map(async (interest) => {
                const term = INTEREST_MAPPING[interest]?.google || 'tourist attraction';
                const query = `${term} in ${destination}`;
                
                try {
                    const response = await axios.get(`https://maps.googleapis.com/maps/api/place/textsearch/json`, {
                        params: {
                            query,
                            location: `${latitude},${longitude}`,
                            radius: 20000, 
                            key: apiKey
                        },
                        timeout: 10000
                    });
                    
                    if (response.data.status === 'OK') {
                        return response.data.results.map(place => ({
                            placeId: place.place_id,
                            name: place.name,
                            latitude: place.geometry.location.lat,
                            longitude: place.geometry.location.lng,
                            rating: place.rating || null,
                            userRatingsTotal: place.user_ratings_total || 0,
                            address: place.formatted_address || '',
                            category: interest,
                            types: place.types || [],
                            priceLevel: place.price_level !== undefined ? place.price_level : null
                        }));
                    }
                } catch (err) {
                    console.error(`[Places] Google query error for ${interest}:`, err.message);
                }
                return [];
            });
            
            const results = await Promise.all(searchPromises);
            candidates = results.flat();
            
        } catch (error) {
            console.error('[Places] Google API Main Error:', error.message);
        }
    }

    // Fallback: Nominatim
    if (candidates.length === 0) {
        try {
            console.log(`[Places] Using Nominatim category search fallback for: ${destination}`);
            
            const searchPromises = activeInterests.map(async (interest) => {
                const terms = INTEREST_MAPPING[interest]?.osm || ['tourist attraction'];
                const interestResults = [];
                
                for (const term of terms.slice(0, 2)) { 
                    try {
                        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                            params: {
                                q: `${term} in ${destination}`,
                                format: 'json',
                                limit: 10,
                                addressdetails: 1
                            },
                            headers: { 
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                            },
                            timeout: 10000
                        });
                        
                        if (response.data && response.data.length > 0) {
                            response.data.forEach(item => {
                                interestResults.push({
                                    placeId: `osm-${item.osm_id || Math.random().toString(36).substr(2, 9)}`,
                                    name: item.display_name.split(',')[0],
                                    latitude: parseFloat(item.lat),
                                    longitude: parseFloat(item.lon),
                                    rating: item.importance ? parseFloat((item.importance * 5).toFixed(1)) : null,
                                    userRatingsTotal: item.importance ? Math.round(item.importance * 100) : 0,
                                    address: item.display_name,
                                    category: interest,
                                    types: [item.class, item.type].filter(Boolean),
                                    priceLevel: null
                                });
                            });
                        }
                    } catch (err) {
                        console.error(`[Places] Nominatim query error for ${term}:`, err.message);
                    }
                }
                return interestResults;
            });
            
            const results = await Promise.all(searchPromises);
            candidates = results.flat();
        } catch (error) {
            console.error('[Places] Nominatim Fallback Error:', error.message);
        }
    }

    const seen = new Set();
    const uniqueCandidates = candidates.filter(place => {
        const id = place.placeId;
        const coordKey = `${place.latitude.toFixed(4)},${place.longitude.toFixed(4)}`;
        if (seen.has(id) || seen.has(coordKey)) return false;
        seen.add(id);
        seen.add(coordKey);
        return true;
    });

    uniqueCandidates.sort((a, b) => {
        if (b.rating !== a.rating) {
            return (b.rating || 0) - (a.rating || 0);
        }
        return (b.userRatingsTotal || 0) - (a.userRatingsTotal || 0);
    });

    console.log(`[Places] Found ${uniqueCandidates.length} unique place candidates for ${destination}`);
    cache.set(cacheKey, uniqueCandidates);
    return uniqueCandidates;
};

const getPlaceDetails = async (placeId) => {
    const apiKey = (process.env.GOOGLE_MAPS_API_KEY || "").trim();
    if (apiKey && apiKey !== "your_api_key_here" && !placeId.startsWith('osm-')) {
        try {
            console.log(`[Place Details] Fetching details for Google Place ID: ${placeId}`);
            const response = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json`, {
                params: {
                    place_id: placeId,
                    fields: 'name,formatted_address,geometry,rating,opening_hours,website,formatted_phone_number,types,photos',
                    key: apiKey
                },
                timeout: 10000
            });
            if (response.data.status === 'OK') {
                const place = response.data.result;
                return {
                    placeId,
                    name: place.name,
                    address: place.formatted_address,
                    latitude: place.geometry.location.lat,
                    longitude: place.geometry.location.lng,
                    rating: place.rating || null,
                    openingHours: place.opening_hours ? place.opening_hours.weekday_text : null,
                    isOpenNow: place.opening_hours?.open_now !== undefined ? place.opening_hours.open_now : null,
                    website: place.website || null,
                    phone: place.formatted_phone_number || null,
                    photos: place.photos ? place.photos.slice(0, 3).map(p => p.photo_reference) : []
                };
            }
        } catch (error) {
            console.error(`[Place Details] Error for ${placeId}:`, error.message);
        }
    }
    
    return null;
};

module.exports = { searchPlaces, getPlaceDetails };
