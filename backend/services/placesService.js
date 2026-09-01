const axios = require('axios');

const cache = new Map();


// ============================================================
// INTEREST MAPPING
// ============================================================

const INTEREST_MAPPING = {

    nature: {
        google: 'waterfall, nature reserve, state park, national park, hiking area',
        osm: ['waterfall', 'nature reserve', 'national park', 'forest']
    },

    historical: {
        google: 'historic site, monument, castle, ruins, museum',
        osm: ['historic site', 'monument', 'castle', 'ruins']
    },

    adventure: {
        google: 'amusement park, adventure park, theme park, zoo',
        osm: ['amusement park', 'adventure', 'theme park', 'zoo']
    },

    beaches: {
        google: 'beach, lake, seaside',
        osm: ['beach', 'lake', 'coast']
    },

    temples: {
        google: 'temple, church, mosque, shrine, place of worship',
        osm: ['temple', 'church', 'mosque', 'shrine']
    },

    shopping: {
        google: 'shopping mall, marketplace, flea market',
        osm: ['shopping mall', 'market', 'bazaar']
    },

    food: {
        google: 'restaurant, cafe, bakery, food court',
        osm: ['restaurant', 'cafe', 'bakery']
    },

    museums: {
        google: 'museum, art gallery, science center',
        osm: ['museum', 'art gallery']
    },

    nightlife: {
        google: 'bar, pub, night club',
        osm: ['bar', 'pub', 'nightclub']
    },

    photography: {
        google: 'scenic viewpoint, observation deck, landmark',
        osm: ['viewpoint', 'scenic spot', 'landmark']
    }

};


// ============================================================
// DESTINATION SEARCHES
// ============================================================

const DESTINATION_SEARCHES = [

    'top tourist attractions',
    'famous places to visit',
    'must visit places',
    'best places to visit',
    'popular tourist attractions',
    'tourist attractions'

];


// ============================================================
// INVALID ROAD / INTERNAL ID DETECTION
// ============================================================

const isInvalidPlaceName = (name) => {

    if (!name) {
        return true;
    }

    const value =
        String(name)
            .trim()
            .toUpperCase();


    // -----------------------------------------------
    // Road / highway codes
    // -----------------------------------------------

    const roadCodePattern =
        /^(MH|MP|UP|RJ|DL|KA|TN|KL|AP|TS|GJ|HR|PB|BR|WB|OD|JH|CG|UK|HP|JK|GA|AS|NH|SH|MDR|ODR|DR)[-_]?\d+$/;


    if (
        roadCodePattern.test(value)
    ) {

        return true;

    }


    // -----------------------------------------------
    // Generic generated IDs
    // -----------------------------------------------

    const generatedIdPattern =
        /^(POI|LOC|REF|ID|PLACE|LANDMARK|ATTRACTION)[-_]?\d+$/;


    if (
        generatedIdPattern.test(value)
    ) {

        return true;

    }


    // -----------------------------------------------
    // Generic ABC123 style code
    // -----------------------------------------------

    if (
        /^[A-Z]{2,12}[-_]?\d{1,8}$/.test(value)
    ) {

        return true;

    }


    // -----------------------------------------------
    // Numeric only
    // -----------------------------------------------

    if (
        /^\d+$/.test(value)
    ) {

        return true;

    }


    return false;

};


// ============================================================
// VALID COORDINATES
// ============================================================

const hasValidCoordinates = (place) => {

    const lat =
        Number(
            place.latitude ??
            place.lat
        );

    const lon =
        Number(
            place.longitude ??
            place.lon
        );


    return (
        Number.isFinite(lat) &&
        Number.isFinite(lon) &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180
    );

};


// ============================================================
// HAVERSINE DISTANCE
// ============================================================

const calculateDistanceKm = (
    lat1,
    lon1,
    lat2,
    lon2
) => {

    const R = 6371;

    const dLat =
        (lat2 - lat1) *
        Math.PI / 180;

    const dLon =
        (lon2 - lon1) *
        Math.PI / 180;


    const a =
        Math.sin(dLat / 2) ** 2 +

        Math.cos(
            lat1 * Math.PI / 180
        ) *

        Math.cos(
            lat2 * Math.PI / 180
        ) *

        Math.sin(dLon / 2) ** 2;


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;

};


// ============================================================
// FORMAT GOOGLE PLACE
// ============================================================

const formatGooglePlace = (
    place,
    category,
    highlight = false
) => {

    if (
        !place ||
        !place.name ||
        !place.geometry?.location
    ) {

        return null;

    }


    if (
        isInvalidPlaceName(
            place.name
        )
    ) {

        console.log(
            `[Places] Rejected invalid Google place: ${place.name}`
        );

        return null;

    }


    return {

        placeId:
            place.place_id,

        name:
            place.name.trim(),

        latitude:
            Number(
                place.geometry.location.lat
            ),

        longitude:
            Number(
                place.geometry.location.lng
            ),

        rating:
            place.rating ||
            null,

        userRatingsTotal:
            place.user_ratings_total ||
            0,

        address:
            place.formatted_address ||
            '',

        category,

        types:
            place.types ||
            [],

        priceLevel:
            place.price_level !== undefined
                ? place.price_level
                : null,

        isDestinationHighlight:
            highlight

    };

};


// ============================================================
// GOOGLE DESTINATION SEARCH
// ============================================================

const searchDestinationHighlights = async (
    destination,
    latitude,
    longitude,
    apiKey
) => {

    const results = [];


    console.log(
        `[Places] Searching important attractions for ${destination}`
    );


    for (
        const searchTerm of
        DESTINATION_SEARCHES
    ) {

        try {

            const response =
                await axios.get(
                    'https://maps.googleapis.com/maps/api/place/textsearch/json',
                    {

                        params: {

                            query:
                                `${searchTerm} in ${destination}`,

                            location:
                                `${latitude},${longitude}`,

                            radius:
                                20000,

                            key:
                                apiKey

                        },

                        timeout:
                            10000

                    }
                );


            if (
                response.data.status ===
                'OK'
            ) {

                for (
                    const place of
                    response.data.results
                ) {

                    const formatted =
                        formatGooglePlace(
                            place,
                            'destination_highlight',
                            true
                        );


                    if (
                        formatted
                    ) {

                        results.push(
                            formatted
                        );

                    }

                }

            }

        } catch (error) {

            console.error(
                `[Places] Highlight search error (${searchTerm}):`,
                error.message
            );

        }

    }


    return results;

};


// ============================================================
// GOOGLE INTEREST SEARCH
// ============================================================

const searchGoogleInterestPlaces = async (
    destination,
    latitude,
    longitude,
    interests,
    apiKey
) => {

    const results = [];


    for (
        const interest of
        interests
    ) {

        const mapping =
            INTEREST_MAPPING[
            interest
            ];


        const query =
            mapping?.google ||
            'tourist attraction';


        try {

            const response =
                await axios.get(
                    'https://maps.googleapis.com/maps/api/place/textsearch/json',
                    {

                        params: {

                            query:
                                `${query} in ${destination}`,

                            location:
                                `${latitude},${longitude}`,

                            radius:
                                20000,

                            key:
                                apiKey

                        },

                        timeout:
                            10000

                    }
                );


            if (
                response.data.status ===
                'OK'
            ) {

                for (
                    const place of
                    response.data.results
                ) {

                    const formatted =
                        formatGooglePlace(
                            place,
                            interest,
                            false
                        );


                    if (
                        formatted
                    ) {

                        results.push(
                            formatted
                        );

                    }

                }

            }

        } catch (error) {

            console.error(
                `[Places] Google ${interest} search error:`,
                error.message
            );

        }

    }


    return results;

};


// ============================================================
// NOMINATIM
// ============================================================

const searchNominatimPlaces = async (
    destination,
    interests
) => {

    const results = [];


    const queries = [

        'tourist attraction',
        'tourist destination',
        'place to visit'

    ];


    // ========================================================
    // DESTINATION SEARCH
    // ========================================================

    for (
        const term of
        queries
    ) {

        try {

            const response =
                await axios.get(
                    'https://nominatim.openstreetmap.org/search',
                    {

                        params: {

                            q:
                                `${term} in ${destination}`,

                            format:
                                'json',

                            limit:
                                20,

                            addressdetails:
                                1

                        },

                        headers: {

                            'User-Agent':
                                'VoyageAI/1.0'

                        },

                        timeout:
                            10000

                    }
                );


            if (
                Array.isArray(
                    response.data
                )
            ) {

                for (
                    const item of
                    response.data
                ) {

                    const name =
                        item.display_name
                            ?.split(',')[0]
                            ?.trim();


                    if (
                        isInvalidPlaceName(
                            name
                        )
                    ) {

                        console.log(
                            `[Places] Rejected Nominatim road/code: ${name}`
                        );

                        continue;

                    }


                    const latitude =
                        Number(
                            item.lat
                        );

                    const longitude =
                        Number(
                            item.lon
                        );


                    if (
                        !Number.isFinite(
                            latitude
                        ) ||
                        !Number.isFinite(
                            longitude
                        )
                    ) {

                        continue;

                    }


                    results.push({

                        placeId:
                            `osm-${item.osm_id || Math.random().toString(36).slice(2)}`,

                        name,

                        latitude,

                        longitude,

                        rating:
                            item.importance
                                ? Number(
                                    (
                                        item.importance *
                                        5
                                    ).toFixed(1)
                                )
                                : null,

                        userRatingsTotal:
                            0,

                        address:
                            item.display_name ||
                            '',

                        category:
                            'destination_highlight',

                        types:
                            [
                                item.class,
                                item.type
                            ].filter(Boolean),

                        priceLevel:
                            null,

                        isDestinationHighlight:
                            true

                    });

                }

            }

        } catch (error) {

            console.error(
                `[Places] Nominatim error for ${term}:`,
                error.message
            );

        }

    }


    // ========================================================
    // INTEREST SEARCH
    // ========================================================

    for (
        const interest of
        interests
    ) {

        const terms =
            INTEREST_MAPPING[
                interest
            ]?.osm ||
            [
                'tourist attraction'
            ];


        for (
            const term of
            terms.slice(0, 2)
        ) {

            try {

                const response =
                    await axios.get(
                        'https://nominatim.openstreetmap.org/search',
                        {

                            params: {

                                q:
                                    `${term} in ${destination}`,

                                format:
                                    'json',

                                limit:
                                    10,

                                addressdetails:
                                    1

                            },

                            headers: {

                                'User-Agent':
                                    'VoyageAI/1.0'

                            },

                            timeout:
                                10000

                        }
                    );


                if (
                    Array.isArray(
                        response.data
                    )
                ) {

                    for (
                        const item of
                        response.data
                    ) {

                        const name =
                            item.display_name
                                ?.split(',')[0]
                                ?.trim();


                        if (
                            isInvalidPlaceName(
                                name
                            )
                        ) {

                            continue;

                        }


                        const latitude =
                            Number(
                                item.lat
                            );

                        const longitude =
                            Number(
                                item.lon
                            );


                        if (
                            !Number.isFinite(
                                latitude
                            ) ||
                            !Number.isFinite(
                                longitude
                            )
                        ) {

                            continue;

                        }


                        results.push({

                            placeId:
                                `osm-${item.osm_id || Math.random().toString(36).slice(2)}`,

                            name,

                            latitude,

                            longitude,

                            rating:
                                item.importance
                                    ? Number(
                                        (
                                            item.importance *
                                            5
                                        ).toFixed(1)
                                    )
                                    : null,

                            userRatingsTotal:
                                0,

                            address:
                                item.display_name ||
                                '',

                            category:
                                interest,

                            types:
                                [
                                    item.class,
                                    item.type
                                ].filter(Boolean),

                            priceLevel:
                                null,

                            isDestinationHighlight:
                                false

                        });

                    }

                }

            } catch (error) {

                console.error(
                    `[Places] Nominatim ${term} error:`,
                    error.message
                );

            }

        }

    }


    return results;

};


// ============================================================
// REMOVE DUPLICATES
// ============================================================

const removeDuplicates = (
    places
) => {

    const seenIds =
        new Set();

    const seenNames =
        new Set();

    const seenCoordinates =
        new Set();


    return places.filter(
        place => {

            if (
                !hasValidCoordinates(
                    place
                )
            ) {

                return false;

            }


            if (
                isInvalidPlaceName(
                    place.name
                )
            ) {

                return false;

            }


            const name =
                String(
                    place.name
                )
                    .trim()
                    .toLowerCase();


            const id =
                place.placeId;


            const coordinate =
                `${Number(place.latitude).toFixed(4)},${Number(place.longitude).toFixed(4)}`;


            if (
                seenIds.has(id) ||
                seenNames.has(name) ||
                seenCoordinates.has(coordinate)
            ) {

                return false;

            }


            seenIds.add(id);

            seenNames.add(name);

            seenCoordinates.add(
                coordinate
            );


            return true;

        }
    );

};


// ============================================================
// SCORE PLACE
// ============================================================

const scorePlace = (
    place,
    destination,
    distance
) => {

    let score = 0;


    const destinationName =
        String(
            destination
        )
            .toLowerCase();


    const placeName =
        String(
            place.name
        )
            .toLowerCase();


    const address =
        String(
            place.address
        )
            .toLowerCase();


    // Destination highlight
    if (
        place.isDestinationHighlight
    ) {

        score += 100;

    }


    // Name contains destination
    if (
        placeName.includes(
            destinationName
        )
    ) {

        score += 40;

    }


    // Address contains destination
    if (
        address.includes(
            destinationName
        )
    ) {

        score += 30;

    }


    // Distance
    if (
        distance <= 2
    ) {

        score += 40;

    } else if (
        distance <= 5
    ) {

        score += 30;

    } else if (
        distance <= 10
    ) {

        score += 20;

    } else if (
        distance <= 20
    ) {

        score += 10;

    }


    // Rating
    if (
        place.rating
    ) {

        score +=
            Number(
                place.rating
            ) * 5;

    }


    // Reviews
    if (
        place.userRatingsTotal
    ) {

        score += Math.min(
            20,
            Math.log10(
                place.userRatingsTotal + 1
            ) * 3
        );

    }


    return Number(
        score.toFixed(2)
    );

};


// ============================================================
// CLASSIFY
// ============================================================

const classifyPlaces = (
    places,
    destination,
    latitude,
    longitude
) => {

    const enriched =
        places.map(
            place => {

                const distance =
                    calculateDistanceKm(
                        latitude,
                        longitude,
                        place.latitude,
                        place.longitude
                    );


                return {

                    ...place,

                    distanceFromDestinationKm:
                        Number(
                            distance.toFixed(2)
                        ),

                    destinationRelevanceScore:
                        scorePlace(
                            place,
                            destination,
                            distance
                        )

                };

            }
        );


    // ========================================================
    // PRIMARY
    //
    // Within 20 km of destination
    // ========================================================

    const primaryPlaces =
        enriched
            .filter(
                place =>
                    place.distanceFromDestinationKm <= 20
            )
            .sort(
                (a, b) => {

                    if (
                        a.isDestinationHighlight !==
                        b.isDestinationHighlight
                    ) {

                        return a.isDestinationHighlight
                            ? -1
                            : 1;

                    }


                    return (
                        b.destinationRelevanceScore -
                        a.destinationRelevanceScore
                    );

                }
            );


    // ========================================================
    // NEARBY
    //
    // 20 - 120 km
    // ========================================================

    const nearbyPlaces =
        enriched
            .filter(
                place =>
                    place.distanceFromDestinationKm > 20 &&
                    place.distanceFromDestinationKm <= 120
            )
            .sort(
                (a, b) =>
                    b.destinationRelevanceScore -
                    a.destinationRelevanceScore
            );


    return {

        primaryPlaces,

        nearbyPlaces,

        allPlaces:
            enriched

    };

};


// ============================================================
// MAIN SEARCH
// ============================================================

const searchPlaces = async (
    destination,
    latitude,
    longitude,
    interests = [],
    budget = 50000
) => {

    const activeInterests =
        Array.isArray(interests) &&
            interests.length > 0

            ? interests

            : [
                'nature',
                'historical',
                'photography'
            ];


    const cacheKey =
        `${destination.toLowerCase()}-${latitude.toFixed(3)}-${longitude.toFixed(3)}-${[...activeInterests].sort().join(',')}`;


    if (
        cache.has(cacheKey)
    ) {

        console.log(
            `[Places] Cache hit: ${destination}`
        );


        return cache.get(
            cacheKey
        );

    }


    const apiKey =
        (
            process.env.GOOGLE_MAPS_API_KEY ||
            ''
        ).trim();


    let candidates = [];


    // ========================================================
    // GOOGLE
    // ========================================================

    if (
        apiKey &&
        apiKey !== 'your_api_key_here'
    ) {

        console.log(
            `[Places] Searching Google Places for ${destination}`
        );


        const highlights =
            await searchDestinationHighlights(
                destination,
                latitude,
                longitude,
                apiKey
            );


        candidates.push(
            ...highlights
        );


        const interestPlaces =
            await searchGoogleInterestPlaces(
                destination,
                latitude,
                longitude,
                activeInterests,
                apiKey
            );


        candidates.push(
            ...interestPlaces
        );

    }


    // ========================================================
    // NOMINATIM FALLBACK
    // ========================================================

    if (
        candidates.length === 0
    ) {

        console.log(
            `[Places] Google unavailable. Using Nominatim.`
        );


        candidates =
            await searchNominatimPlaces(
                destination,
                activeInterests
            );

    }


    // ========================================================
    // CLEAN
    // ========================================================

    candidates =
        removeDuplicates(
            candidates
        );


    console.log(
        `[Places] ${candidates.length} valid places after cleaning`
    );


    if (
        candidates.length === 0
    ) {

        return [];

    }


    // ========================================================
    // CLASSIFICATION
    // ========================================================

    const classified =
        classifyPlaces(
            candidates,
            destination,
            latitude,
            longitude
        );


    // ========================================================
    // IMPORTANT:
    // RETURN AN ARRAY FOR BACKWARD COMPATIBILITY
    // ========================================================

    const result =
        [
            ...classified.primaryPlaces,
            ...classified.nearbyPlaces
        ];


    // Attach new classification data
    // to the array itself.
    //
    // This allows both:
    //
    // result.slice(...)
    //
    // and:
    //
    // result.primaryPlaces
    //
    // to work.

    result.primaryPlaces =
        classified.primaryPlaces;

    result.nearbyPlaces =
        classified.nearbyPlaces;

    result.allPlaces =
        classified.allPlaces;


    // ========================================================
    // LOG PRIMARY PLACES
    // ========================================================

    console.log(
        '\n=========================================='
    );

    console.log(
        `[Places] PRIMARY PLACES FOR ${destination.toUpperCase()}`
    );

    console.log(
        '=========================================='
    );


    classified.primaryPlaces
        .slice(0, 20)
        .forEach(
            (place, index) => {

                console.log(
                    `${index + 1}. ${place.name} | ${place.distanceFromDestinationKm} km`
                );

            }
        );


    // ========================================================
    // LOG NEARBY
    // ========================================================

    console.log(
        '\n=========================================='
    );

    console.log(
        '[Places] NEARBY / SIDE TRIPS'
    );

    console.log(
        '=========================================='
    );


    classified.nearbyPlaces
        .slice(0, 20)
        .forEach(
            (place, index) => {

                console.log(
                    `${index + 1}. ${place.name} | ${place.distanceFromDestinationKm} km`
                );

            }
        );


    console.log(
        '==========================================\n'
    );


    cache.set(
        cacheKey,
        result
    );


    return result;

};


// ============================================================
// PLACE DETAILS
// ============================================================

const getPlaceDetails = async (
    placeId
) => {

    if (
        !placeId
    ) {

        return null;

    }


    const apiKey =
        (
            process.env.GOOGLE_MAPS_API_KEY ||
            ''
        ).trim();


    if (
        !apiKey ||
        apiKey === 'your_api_key_here' ||
        placeId.startsWith('osm-')
    ) {

        return null;

    }


    try {

        const response =
            await axios.get(
                'https://maps.googleapis.com/maps/api/place/details/json',
                {

                    params: {

                        place_id:
                            placeId,

                        fields:
                            'name,formatted_address,geometry,rating,opening_hours,website,formatted_phone_number,types,photos',

                        key:
                            apiKey

                    },

                    timeout:
                        10000

                }
            );


        if (
            response.data.status !==
            'OK'
        ) {

            return null;

        }


        const place =
            response.data.result;


        return {

            placeId,

            name:
                place.name,

            address:
                place.formatted_address ||
                '',

            latitude:
                place.geometry?.location?.lat,

            longitude:
                place.geometry?.location?.lng,

            rating:
                place.rating ||
                null,

            openingHours:
                place.opening_hours
                    ? place.opening_hours.weekday_text
                    : null,

            isOpenNow:
                place.opening_hours?.open_now ??
                null,

            website:
                place.website ||
                null,

            phone:
                place.formatted_phone_number ||
                null,

            photos:
                place.photos
                    ? place.photos
                        .slice(0, 3)
                        .map(
                            photo =>
                                photo.photo_reference
                        )
                    : []

        };

    } catch (error) {

        console.error(
            `[Place Details] Error:`,
            error.message
        );


        return null;

    }

};


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    searchPlaces,

    getPlaceDetails

};