const axios = require('axios');

require('dotenv').config();


// ======================================================
// CONFIGURATION
// ======================================================

const NOMINATIM_URL =
    'https://nominatim.openstreetmap.org';

const NOMINATIM_DELAY = 1100;


// ======================================================
// COUNTRY → CURRENCY MAP
// ======================================================

const countryCurrencyMap = {

    // Asia
    IN: 'INR',
    JP: 'JPY',
    CN: 'CNY',
    KR: 'KRW',
    SG: 'SGD',
    MY: 'MYR',
    TH: 'THB',
    ID: 'IDR',
    PH: 'PHP',
    VN: 'VND',
    BD: 'BDT',
    LK: 'LKR',
    NP: 'NPR',
    PK: 'PKR',
    AE: 'AED',
    SA: 'SAR',
    QA: 'QAR',
    KW: 'KWD',
    IL: 'ILS',
    TR: 'TRY',

    // Europe
    GB: 'GBP',
    DE: 'EUR',
    FR: 'EUR',
    IT: 'EUR',
    ES: 'EUR',
    PT: 'EUR',
    NL: 'EUR',
    BE: 'EUR',
    AT: 'EUR',
    IE: 'EUR',
    FI: 'EUR',
    GR: 'EUR',
    CH: 'CHF',
    NO: 'NOK',
    SE: 'SEK',
    DK: 'DKK',
    PL: 'PLN',
    CZ: 'CZK',
    HU: 'HUF',
    RO: 'RON',
    RU: 'RUB',
    UA: 'UAH',

    // North America
    US: 'USD',
    CA: 'CAD',
    MX: 'MXN',

    // South America
    BR: 'BRL',
    AR: 'ARS',
    CL: 'CLP',
    CO: 'COP',
    PE: 'PEN',

    // Oceania
    AU: 'AUD',
    NZ: 'NZD',
    FJ: 'FJD',

    // Africa
    ZA: 'ZAR',
    EG: 'EGP',
    NG: 'NGN',
    KE: 'KES',
    GH: 'GHS',
    MA: 'MAD',
    TZ: 'TZS',
    UG: 'UGX'

};


// ======================================================
// CURRENCY SYMBOLS
// ======================================================

const currencySymbols = {

    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
    KRW: '₩',

    AUD: 'A$',
    CAD: 'C$',
    SGD: 'S$',

    CHF: 'CHF',

    AED: 'د.إ',
    SAR: '﷼',

    THB: '฿',
    MYR: 'RM',
    IDR: 'Rp',
    PHP: '₱',
    VND: '₫',

    LKR: 'Rs',
    NPR: 'Rs',
    PKR: '₨',
    BDT: '৳',

    ZAR: 'R',
    BRL: 'R$',
    MXN: '$',
    RUB: '₽',
    TRY: '₺',

    PLN: 'zł',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',

    NZD: 'NZ$',

    ILS: '₪',
    CZK: 'Kč',
    HUF: 'Ft',
    RON: 'lei',
    UAH: '₴',

    EGP: '£',
    NGN: '₦',
    KES: 'KSh',
    GHS: '₵',
    MAD: 'د.م.',
    TZS: 'TSh',
    UGX: 'USh',

    ARS: '$',
    CLP: '$',
    COP: '$',
    PEN: 'S/'

};


// ======================================================
// CACHE
// ======================================================

const locationCache = new Map();

const searchCache = new Map();

const landmarkCache = new Map();

const CACHE_DURATION =
    60 * 60 * 1000;


// ======================================================
// NOMINATIM QUEUE
// ======================================================

let lastNominatimRequest = 0;

let nominatimQueue =
    Promise.resolve();


const wait = (ms) =>
    new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );


const queueNominatimRequest = (
    requestFunction
) => {

    const run =
        nominatimQueue.then(
            async () => {

                const now =
                    Date.now();

                const elapsed =
                    now -
                    lastNominatimRequest;


                if (
                    elapsed <
                    NOMINATIM_DELAY
                ) {

                    await wait(
                        NOMINATIM_DELAY -
                        elapsed
                    );

                }


                lastNominatimRequest =
                    Date.now();


                return requestFunction();

            }
        );


    nominatimQueue =
        run.catch(
            () => { }
        );


    return run;

};


// ======================================================
// NOMINATIM REQUEST
// ======================================================

const nominatimRequest = async (
    params,
    timeout = 15000
) => {

    let attempt = 0;

    const maxAttempts = 3;


    while (
        attempt <
        maxAttempts
    ) {

        attempt++;


        try {

            return await queueNominatimRequest(
                async () => {

                    return await axios.get(
                        `${NOMINATIM_URL}/search`,
                        {

                            params: {
                                ...params
                            },

                            headers: {

                                'User-Agent':
                                    'VoyageAI/1.0 (travel-planner)',

                                'Accept-Language':
                                    'en'

                            },

                            timeout

                        }
                    );

                }
            );


        } catch (error) {

            const status =
                error.response?.status;


            if (
                status === 429 &&
                attempt <
                maxAttempts
            ) {

                const retryAfter =
                    Number(
                        error.response
                            ?.headers
                        ?.['retry-after']
                    );


                const retryTime =
                    retryAfter > 0
                        ? retryAfter * 1000
                        : 3000 * attempt;


                console.warn(
                    `Nominatim rate limited. Retrying in ${retryTime}ms...`
                );


                await wait(
                    retryTime
                );


                continue;

            }


            throw error;

        }

    }

};


// ======================================================
// GET COUNTRY + CURRENCY
// ======================================================

const getCountryAndCurrency =
    async (placeName) => {

        const cleanPlace =
            String(
                placeName || ''
            ).trim();


        if (!cleanPlace) {

            throw new Error(
                'Place name is required'
            );

        }


        const cacheKey =
            cleanPlace.toLowerCase();


        const cached =
            locationCache.get(
                cacheKey
            );


        if (
            cached &&
            Date.now() -
            cached.timestamp <
            CACHE_DURATION
        ) {

            console.log(
                `Location cache hit: ${cleanPlace}`
            );


            return cached.data;

        }


        try {

            const geoResponse =
                await nominatimRequest(
                    {

                        q:
                            cleanPlace,

                        format:
                            'json',

                        addressdetails:
                            1,

                        limit:
                            5,

                        namedetails:
                            1

                    },
                    15000
                );


            if (
                !geoResponse.data ||
                geoResponse.data.length === 0
            ) {

                throw new Error(
                    'Location not found'
                );

            }


            const location =
                geoResponse.data[0];


            const address =
                location.address ||
                {};


            const countryCode =
                address.country_code
                    ?.toUpperCase();


            const countryName =
                address.country;


            if (!countryCode) {

                throw new Error(
                    'Country code not found'
                );

            }


            console.log(
                `Nominatim: ${cleanPlace} -> ${countryCode}`
            );


            let currencyCode =
                countryCurrencyMap[
                countryCode
                ];


            if (!currencyCode) {

                try {

                    const countryResponse =
                        await axios.get(
                            `https://countries.dev/alpha/${countryCode}`,
                            {
                                timeout: 10000
                            }
                        );


                    const currencies =
                        countryResponse
                            .data
                            ?.currencies;


                    if (
                        currencies &&
                        currencies.length > 0
                    ) {

                        currencyCode =
                            currencies[0].code;

                    }

                } catch (
                currencyError
                ) {

                    console.warn(
                        `Currency API failed for ${countryCode}:`,
                        currencyError.message
                    );

                }

            }


            if (!currencyCode) {

                throw new Error(
                    `Currency not found for ${countryCode}`
                );

            }


            currencyCode =
                currencyCode.toUpperCase();


            const parentLocation =
                address.city ||
                address.town ||
                address.village ||
                address.municipality ||
                address.county ||
                countryName;


            const nominatimName =
                String(
                    location.name ||
                    location.namedetails?.name ||
                    ''
                ).trim();


            const resolvedName =
                nominatimName ||
                cleanPlace;


            const safeResolvedName =
                (
                    resolvedName.toLowerCase() ===
                    String(
                        countryName || ''
                    ).trim().toLowerCase()
                )
                    ? cleanPlace
                    : resolvedName;


            const result = {

                countryCode,

                countryName,

                resolvedName:
                    safeResolvedName,

                parentLocation,

                currencyCode,

                currencySymbol:
                    currencySymbols[
                    currencyCode
                    ] ||
                    currencyCode,

                isIndia:
                    countryCode === 'IN'

            };


            locationCache.set(
                cacheKey,
                {

                    timestamp:
                        Date.now(),

                    data:
                        result

                }
            );


            return result;


        } catch (error) {

            console.error(
                'Location Resolution Error:',
                error.message
            );


            throw error;

        }

    };


// ======================================================
// SEARCH LOCATIONS
// ======================================================

const searchLocations =
    async (query) => {

        const cleanQuery =
            String(
                query || ''
            ).trim();


        if (
            cleanQuery.length < 3
        ) {

            return [];

        }


        const cacheKey =
            cleanQuery.toLowerCase();


        const cached =
            searchCache.get(
                cacheKey
            );


        if (
            cached &&
            Date.now() -
            cached.timestamp <
            CACHE_DURATION
        ) {

            return cached.data;

        }


        try {

            const response =
                await nominatimRequest(
                    {

                        q:
                            cleanQuery,

                        format:
                            'json',

                        addressdetails:
                            1,

                        namedetails:
                            1,

                        limit:
                            8

                    },
                    10000
                );


            const results =
                (
                    response.data ||
                    []
                ).map(
                    item => {

                        const address =
                            item.address ||
                            {};


                        const placeName =
                            String(
                                item.name ||
                                item.namedetails?.name ||
                                item.display_name
                                    ?.split(',')[0] ||
                                ''
                            ).trim();


                        return {

                            display_name:
                                item.display_name,

                            name:
                                placeName,

                            lat:
                                item.lat,

                            lon:
                                item.lon,

                            type:
                                item.type,

                            country:
                                address.country,

                            countryCode:
                                address.country_code
                                    ?.toUpperCase(),

                            city:
                                address.city ||
                                address.town ||
                                address.village ||
                                address.municipality ||
                                '',

                            place:
                                placeName

                        };

                    }
                );


            searchCache.set(
                cacheKey,
                {

                    timestamp:
                        Date.now(),

                    data:
                        results

                }
            );


            return results;


        } catch (error) {

            console.error(
                'Search Error:',
                error.response?.status ||
                error.message
            );


            return [];

        }

    };


// ======================================================
// LANDMARK NAME VALIDATION
// ======================================================

const isInvalidLandmarkName = (
    name
) => {

    if (
        !name ||
        typeof name !== 'string'
    ) {

        return true;

    }


    const value =
        name.trim();


    if (
        value.length < 3
    ) {

        return true;

    }


    // Road/internal IDs
    if (
        /^(MDR|NH|SH|MH|MP|UP|RJ|DL|KA|TN|KL|AP|TS|GJ|HR|PB|BR|WB|OD|JH|CG|UK|HP|JK|GA|AS|POI|LOC|REF|ID|ODR|DR)[-_]?\d+$/i.test(
            value
        )
    ) {

        return true;

    }


    // Generic IDs
    if (
        /^[A-Z]{2,12}[-_]?\d{1,8}$/i.test(
            value
        )
    ) {

        return true;

    }


    // Numeric only
    if (
        /^\d+$/.test(value)
    ) {

        return true;

    }


    return false;

};


// ======================================================
// LANDMARK VALIDATION
// ======================================================

const isValidLandmark = (
    item
) => {

    if (
        !item ||
        typeof item !== 'object'
    ) {

        return false;

    }


    const displayName =
        String(
            item.display_name ||
            ''
        ).trim();


    const name =
        String(
            item.name ||
            item.namedetails?.name ||
            displayName.split(',')[0] ||
            ''
        ).trim();


    if (
        isInvalidLandmarkName(name)
    ) {

        return false;

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
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {

        return false;

    }


    const itemClass =
        String(
            item.class ||
            ''
        ).toLowerCase();


    const itemType =
        String(
            item.type ||
            ''
        ).toLowerCase();


    // ==================================================
    // ROAD FILTER
    // ==================================================

    const roadTypes = [

        'road',
        'residential',
        'secondary',
        'tertiary',
        'primary',
        'motorway',
        'trunk',
        'unclassified',
        'service',
        'track',
        'path',
        'footway',
        'cycleway',
        'pedestrian',
        'living_street'

    ];


    if (
        itemClass === 'highway' ||
        roadTypes.includes(itemType)
    ) {

        return false;

    }


    // ==================================================
    // BAD CLASSES
    // ==================================================

    const rejectedClasses = [

        'boundary',
        'railway',
        'aeroway',
        'power'

    ];


    if (
        rejectedClasses.includes(itemClass)
    ) {

        return false;

    }


    // ==================================================
    // BLACKLIST
    // ==================================================

    const blacklist = [

        'road',
        'highway',
        'street',
        'lane',
        'station',
        'bus stop',
        'bus stand',
        'train',
        'metro',
        'airport',
        'school',
        'college',
        'university',
        'office',
        'company',
        'shop',
        'store',
        'mall',
        'market',
        'bank',
        'atm',
        'fuel',
        'petrol',
        'residential',
        'apartment',
        'hospital',
        'clinic',
        'parking',
        'garage',
        'hotel',
        'motel',
        'hostel',
        'resort',
        'lodge',
        'villa',
        'guest house',
        'restaurant',
        'cafe',
        'bar',
        'pharmacy',
        'masjid',
        'mosque'

    ];


    const fullName =
        displayName.toLowerCase();


    const isBlacklisted =
        blacklist.some(
            word =>
                fullName.includes(word) ||
                name.toLowerCase().includes(word)
        );


    if (
        isBlacklisted
    ) {

        return false;

    }


    // ==================================================
    // TOURIST TYPES
    // ==================================================

    const touristClasses = [

        'tourism',
        'historic',
        'heritage',
        'leisure',
        'natural'

    ];


    const touristTypes = [

        'attraction',
        'museum',
        'monument',
        'viewpoint',
        'temple',
        'shrine',
        'church',
        'cathedral',
        'park',
        'garden',
        'waterfall',
        'memorial',
        'heritage',
        'ruins',
        'archaeological_site'

    ];


    const isTouristClass =
        touristClasses.includes(
            itemClass
        );


    const isTouristType =
        touristTypes.includes(
            itemType
        );


    if (
        !isTouristClass &&
        !isTouristType
    ) {

        return false;

    }


    return true;

};


// ======================================================
// CALCULATE POPULARITY SCORE
// ======================================================

const calculatePopularityScore = (
    item
) => {

    const importance =
        Number(
            item.importance
        ) || 0;


    const itemClass =
        String(
            item.class ||
            ''
        ).toLowerCase();


    const itemType =
        String(
            item.type ||
            ''
        ).toLowerCase();


    let score =
        importance * 100;


    // Strong boost for tourism objects
    if (
        itemClass === 'tourism'
    ) {

        score += 50;

    }


    // Strong boost for historic places
    if (
        itemClass === 'historic'
    ) {

        score += 40;

    }


    // Attraction types
    const importantTypes = [

        'attraction',
        'monument',
        'museum',
        'viewpoint',
        'temple',
        'shrine',
        'heritage',
        'archaeological_site'

    ];


    if (
        importantTypes.includes(itemType)
    ) {

        score += 30;

    }


    // Famous categories
    if (
        itemType === 'temple'
    ) {

        score += 20;

    }


    if (
        itemType === 'monument'
    ) {

        score += 20;

    }


    if (
        itemType === 'museum'
    ) {

        score += 15;

    }


    return Number(
        score.toFixed(2)
    );

};


// ======================================================
// GET LANDMARKS
// ======================================================

const getLandmarks =
    async (destination) => {

        const cleanDestination =
            String(
                destination || ''
            ).trim();


        if (!cleanDestination) {

            return [];

        }


        const cacheKey =
            cleanDestination.toLowerCase();


        const cached =
            landmarkCache.get(
                cacheKey
            );


        if (
            cached &&
            Date.now() -
            cached.timestamp <
            CACHE_DURATION
        ) {

            console.log(
                `Landmark cache hit: ${cleanDestination}`
            );


            return cached.data;

        }


        try {

            // ==================================================
            // DESTINATION COORDINATES
            // ==================================================

            console.log(
                `[Landmark Search] Finding coordinates for ${cleanDestination}`
            );


            const locationResponse =
                await nominatimRequest(
                    {

                        q:
                            cleanDestination,

                        format:
                            'json',

                        addressdetails:
                            1,

                        namedetails:
                            1,

                        limit:
                            1

                    },
                    15000
                );


            if (
                !locationResponse.data ||
                locationResponse.data.length === 0
            ) {

                console.warn(
                    `[Landmark Search] Destination not found: ${cleanDestination}`
                );


                return [];

            }


            const destinationLocation =
                locationResponse.data[0];


            const centerLat =
                Number(
                    destinationLocation.lat
                );


            const centerLon =
                Number(
                    destinationLocation.lon
                );


            if (
                !Number.isFinite(centerLat) ||
                !Number.isFinite(centerLon)
            ) {

                return [];

            }


            console.log(
                `[Landmark Search] Destination coordinates: ${centerLat}, ${centerLon}`
            );


            // ==================================================
            // SEARCH BOX
            // ==================================================

            const latOffset =
                0.15;


            const lonOffset =
                0.15;


            const south =
                centerLat -
                latOffset;


            const north =
                centerLat +
                latOffset;


            const west =
                centerLon -
                lonOffset;


            const east =
                centerLon +
                lonOffset;


            const viewbox =
                `${west},${north},${east},${south}`;


            // ==================================================
            // SEARCH CATEGORIES
            // ==================================================

            const queries = [

                'tourism',
                'attraction',
                'temple',
                'historic',
                'monument',
                'museum',
                'viewpoint',
                'shrine',
                'heritage',
                'park',
                'garden',
                'waterfall',
                'memorial',
                'archaeological site'

            ];


            let allLandmarks = [];


            // ==================================================
            // SEARCH
            // ==================================================

            for (
                const query of queries
            ) {

                try {

                    console.log(
                        `[Landmark Search] Searching: ${query}`
                    );


                    const response =
                        await nominatimRequest(
                            {

                                q:
                                    query,

                                format:
                                    'json',

                                viewbox:
                                    viewbox,

                                bounded:
                                    1,

                                limit:
                                    20,

                                addressdetails:
                                    1,

                                namedetails:
                                    1

                            },
                            20000
                        );


                    const results =
                        response.data ||
                        [];


                    console.log(
                        `[Landmark Search] ${query}: ${results.length} results`
                    );


                    allLandmarks.push(
                        ...results
                    );


                } catch (error) {

                    console.warn(
                        `[Landmark Search] ${query} failed:`,
                        error.message
                    );

                }


                if (
                    allLandmarks.length >= 150
                ) {

                    break;

                }

            }


            // ==================================================
            // DIRECT DESTINATION SEARCHES
            // ==================================================

            const directQueries = [

                `${cleanDestination} temple`,
                `${cleanDestination} tourist attraction`,
                `${cleanDestination} famous places`,
                `${cleanDestination} tourist places`

            ];


            for (
                const query of directQueries
            ) {

                try {

                    const response =
                        await nominatimRequest(
                            {

                                q:
                                    query,

                                format:
                                    'json',

                                limit:
                                    15,

                                addressdetails:
                                    1,

                                namedetails:
                                    1

                            },
                            20000
                        );


                    allLandmarks.push(
                        ...(response.data || [])
                    );


                } catch (error) {

                    console.warn(
                        `[Landmark Search] Direct search failed: ${query}`,
                        error.message
                    );

                }

            }


            // ==================================================
            // NO RESULTS
            // ==================================================

            if (
                allLandmarks.length === 0
            ) {

                console.warn(
                    `[Landmark Search] No landmarks found for ${cleanDestination}`
                );


                return [];

            }


            console.log(
                `[Landmark Search] Total raw results: ${allLandmarks.length}`
            );


            // ==================================================
            // DEDUPLICATION
            // ==================================================

            const seen =
                new Set();


            const landmarks =
                allLandmarks

                    .filter(
                        item => {

                            if (
                                !isValidLandmark(
                                    item
                                )
                            ) {

                                return false;

                            }


                            const name =
                                String(
                                    item.name ||
                                    item.namedetails?.name ||
                                    item.display_name
                                        ?.split(',')[0] ||
                                    ''
                                ).trim();


                            const normalizedName =
                                name
                                    .toLowerCase()
                                    .replace(
                                        /\s+/g,
                                        ' '
                                    );


                            if (
                                seen.has(
                                    normalizedName
                                )
                            ) {

                                return false;

                            }


                            seen.add(
                                normalizedName
                            );


                            return true;

                        }
                    )

                    // ==================================================
                    // MAP TO APPLICATION FORMAT
                    // ==================================================

                    .map(
                        item => {

                            const name =
                                String(
                                    item.name ||
                                    item.namedetails?.name ||
                                    item.display_name
                                        ?.split(',')[0] ||
                                    ''
                                ).trim();


                            const latitude =
                                Number(
                                    item.lat
                                );


                            const longitude =
                                Number(
                                    item.lon
                                );


                            const popularityScore =
                                calculatePopularityScore(
                                    item
                                );


                            return {

                                name,

                                address:
                                    item.display_name ||
                                    '',

                                type:
                                    item.type ||
                                    'attraction',

                                class:
                                    item.class ||
                                    '',

                                importance:
                                    Number(
                                        item.importance
                                    ) ||
                                    0,

                                popularityScore,

                                lat:
                                    latitude,

                                lon:
                                    longitude,

                                latitude,

                                longitude

                            };

                        }
                    )

                    // ==================================================
                    // POPULARITY FIRST
                    // ==================================================

                    .sort(
                        (a, b) =>
                            b.popularityScore -
                            a.popularityScore
                    )

                    .slice(
                        0,
                        30
                    );


            // ==================================================
            // FINAL SAFETY
            // ==================================================

            const finalLandmarks =
                landmarks.filter(
                    place =>
                        place.name &&
                        !isInvalidLandmarkName(
                            place.name
                        ) &&
                        Number.isFinite(
                            place.latitude
                        ) &&
                        Number.isFinite(
                            place.longitude
                        )
                );


            console.log(
                `\n[Landmark Search] Valid landmarks for ${cleanDestination}: ${finalLandmarks.length}`
            );


            finalLandmarks.forEach(
                (
                    place,
                    index
                ) => {

                    console.log(
                        `  ${index + 1}. ${place.name} | popularity=${place.popularityScore} | ${place.type}`
                    );

                }
            );


            // ==================================================
            // CACHE
            // ==================================================

            landmarkCache.set(
                cacheKey,
                {

                    timestamp:
                        Date.now(),

                    data:
                        finalLandmarks

                }
            );


            return finalLandmarks;


        } catch (error) {

            console.error(
                'Landmark Search Error:',
                error.message
            );


            return [];

        }

    };


// ======================================================
// EXPORT
// ======================================================

module.exports = {

    getCountryAndCurrency,

    searchLocations,

    getLandmarks

};