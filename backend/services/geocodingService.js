const axios = require('axios');

require('dotenv').config();


// ======================================================
// CONFIGURATION
// ======================================================

const NOMINATIM_URL =
    'https://nominatim.openstreetmap.org';

const NOMINATIM_DELAY = 1100;


// ======================================================
// COUNTRY → CURRENCY
// ======================================================

const countryCurrencyMap = {

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

    US: 'USD',
    CA: 'CAD',
    MX: 'MXN',

    BR: 'BRL',
    AR: 'ARS',
    CL: 'CLP',
    CO: 'COP',
    PE: 'PEN',

    AU: 'AUD',
    NZ: 'NZD',
    FJ: 'FJD',

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
// CACHES
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
        attempt < maxAttempts
    ) {

        attempt++;


        try {

            return await queueNominatimRequest(
                async () => {

                    return await axios.get(
                        `${NOMINATIM_URL}/search`,
                        {

                            params,

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
                attempt < maxAttempts
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
// DESTINATION RESOLUTION
// ======================================================

const resolveDestination = async (
    placeName
) => {

    if (!placeName) {
        return null;
    }


    const cleanQuery =
        placeName
            .trim()
            .toLowerCase();


    if (
        locationCache.has(
            cleanQuery
        )
    ) {

        const cached =
            locationCache.get(
                cleanQuery
            );


        if (
            Date.now() -
            cached.timestamp <
            CACHE_DURATION
        ) {

            console.log(
                `[Geocoding] Cache hit for: ${placeName}`
            );


            return cached.data;

        }

    }


    const apiKey =
        (
            process.env.GOOGLE_MAPS_API_KEY ||
            ''
        ).trim();


    // ==================================================
    // GOOGLE GEOCODING
    // ==================================================

    if (
        apiKey &&
        apiKey !== 'your_api_key_here'
    ) {

        try {

            console.log(
                `[Geocoding] Using Google Geocoding API for: ${placeName}`
            );


            const response =
                await axios.get(
                    'https://maps.googleapis.com/maps/api/geocode/json',
                    {

                        params: {

                            address:
                                placeName,

                            key:
                                apiKey

                        },

                        timeout:
                            10000

                    }
                );


            if (
                response.data.status ===
                'OK' &&
                response.data.results.length > 0
            ) {

                const result =
                    response.data.results[0];


                const {
                    lat,
                    lng
                } =
                    result.geometry.location;


                const countryComponent =
                    result.address_components.find(
                        component =>
                            component.types.includes(
                                'country'
                            )
                    );


                const country =
                    countryComponent
                        ? countryComponent.long_name
                        : 'Unknown';


                const resolved = {

                    name:
                        result.formatted_address
                            .split(',')[0],

                    latitude:
                        parseFloat(lat),

                    longitude:
                        parseFloat(lng),

                    country,

                    formattedAddress:
                        result.formatted_address

                };


                locationCache.set(
                    cleanQuery,
                    {

                        timestamp:
                            Date.now(),

                        data:
                            resolved

                    }
                );


                return resolved;

            }

        } catch (error) {

            console.error(
                '[Geocoding] Google API Error:',
                error.message
            );

        }

    }


    // ==================================================
    // NOMINATIM FALLBACK
    // ==================================================

    try {

        console.log(
            `[Geocoding] Using Nominatim fallback for: ${placeName}`
        );


        const response =
            await nominatimRequest(
                {

                    q:
                        placeName,

                    format:
                        'json',

                    addressdetails:
                        1,

                    limit:
                        1

                },
                10000
            );


        if (
            response.data &&
            response.data.length > 0
        ) {

            const data =
                response.data[0];


            const country =
                data.address?.country ||
                'Unknown';


            const resolved = {

                name:
                    data.display_name
                        .split(',')[0],

                latitude:
                    parseFloat(
                        data.lat
                    ),

                longitude:
                    parseFloat(
                        data.lon
                    ),

                country,

                formattedAddress:
                    data.display_name

            };


            locationCache.set(
                cleanQuery,
                {

                    timestamp:
                        Date.now(),

                    data:
                        resolved

                }
            );


            return resolved;

        }

    } catch (error) {

        console.error(
            '[Geocoding] Nominatim Fallback Error:',
            error.message
        );

    }


    return null;

};


// ======================================================
// SEARCH LOCATIONS
// ======================================================

const searchLocations = async (
    query
) => {

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
            '[Geocoding] Search Error:',
            error.message
        );


        return [];

    }

};


// ======================================================
// INVALID LANDMARK NAME CHECK
// ======================================================

const isInvalidLandmarkName = (
    name,
    item = {}
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


    // ================================================
    // Reject code-only names
    //
    // MH33
    // MH-33
    // MDR234
    // MDR-234
    // NH44
    // NH-44
    // POI123
    // LOC45
    // ================================================

    const codePattern =
        /^[A-Z]{1,12}[-_]?\d{1,8}$/i;


    if (
        codePattern.test(value)
    ) {

        return true;

    }


    // ================================================
    // Indian road / highway codes
    // ================================================

    const roadCodePattern =
        /^(MH|MP|UP|RJ|DL|KA|TN|KL|AP|TS|GJ|HR|PB|BR|WB|OD|JH|CG|UK|HP|JK|GA|AS|NH|SH|MDR|ODR|DR)[-_]?\d+$/i;


    if (
        roadCodePattern.test(value)
    ) {

        return true;

    }


    // ================================================
    // Internal IDs
    // ================================================

    const referencePattern =
        /^(MDR|NH|SH|AH|ORR|PRR|POI|LOC|REF|ID|PLACE|LANDMARK|ATTRACTION)[-_]?\d+$/i;


    if (
        referencePattern.test(value)
    ) {

        return true;

    }


    // ================================================
    // OSM road objects
    // ================================================

    const itemClass =
        String(
            item.class || ''
        ).toLowerCase();


    const itemType =
        String(
            item.type || ''
        ).toLowerCase();


    const roadTypes = [

        'highway',
        'road',
        'street',
        'motorway',
        'trunk',
        'primary',
        'secondary',
        'tertiary',
        'residential',
        'unclassified',
        'service',
        'track',
        'path',
        'footway'

    ];


    if (
        roadTypes.includes(
            itemClass
        ) ||
        roadTypes.includes(
            itemType
        )
    ) {

        return true;

    }


    return false;

};


// ======================================================
// GET LANDMARKS
// ======================================================

const getLandmarks =
    async (
        destination
    ) => {

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
                `[Landmarks] Cache hit for: ${cleanDestination}`
            );


            return cached.data;

        }


        try {

            const categories = [

                'tourist attraction',
                'museum',
                'monument',
                'viewpoint',
                'castle',
                'palace',
                'church',
                'temple',
                'cathedral',
                'historic site',
                'national park',
                'beach',
                'landmark'

            ];


            let allLandmarks =
                [];


            // ==================================================
            // CATEGORY SEARCH
            // ==================================================

            for (
                const category
                of categories
            ) {

                try {

                    const response =
                        await nominatimRequest(
                            {

                                q:
                                    `${category} in ${cleanDestination}`,

                                format:
                                    'json',

                                limit:
                                    10,

                                addressdetails:
                                    1

                            },
                            20000
                        );


                    allLandmarks.push(
                        ...(response.data || [])
                    );


                } catch (error) {

                    console.warn(
                        `[Landmarks] Category failed: ${category}`,
                        error.message
                    );

                }


                if (
                    allLandmarks.length >= 40
                ) {

                    break;

                }

            }


            // ==================================================
            // BROADER TOURISM SEARCH
            // ==================================================

            if (
                allLandmarks.length < 15
            ) {

                try {

                    const response =
                        await nominatimRequest(
                            {

                                q:
                                    `tourism in ${cleanDestination}`,

                                format:
                                    'json',

                                limit:
                                    30,

                                addressdetails:
                                    1

                            },
                            20000
                        );


                    allLandmarks.push(
                        ...(response.data || [])
                    );


                } catch (error) {

                    console.warn(
                        '[Landmarks] Broader search failed:',
                        error.message
                    );

                }

            }


            if (
                allLandmarks.length === 0
            ) {

                console.warn(
                    `[Landmarks] No landmarks found for ${cleanDestination}`
                );


                return [];

            }


            // ==================================================
            // BLACKLIST
            // ==================================================

            const blacklist = [

                'road',
                'highway',
                'street',
                'station',
                'stop',
                'bus',
                'train',
                'metro',
                'airport',
                'school',
                'university',
                'office',
                'company',
                'shop',
                'mall',
                'bank',
                'fuel',
                'residential',
                'apartment',
                'hospital',
                'atm',
                'parking',
                'garage',
                'hotel',
                'motel',
                'hostel',
                'resort',
                'lodge',
                'villas',
                'guest house',
                'bed & breakfast',
                'restaurant',
                'cafe',
                'bar',
                'pharmacy'

            ];


            const seen =
                new Set();


            // ==================================================
            // CLEAN LANDMARKS
            // ==================================================

            const landmarks =
                allLandmarks

                    .sort(
                        (a, b) =>
                            (
                                b.importance ||
                                0
                            ) -
                            (
                                a.importance ||
                                0
                            )
                    )

                    .filter(
                        item => {

                            const fullName =
                                String(
                                    item.display_name ||
                                    ''
                                ).toLowerCase();


                            const firstName =
                                String(
                                    item.display_name ||
                                    ''
                                )
                                    .split(',')[0]
                                    .trim();


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


                            // ------------------------------------------
                            // CODE / ROAD FILTER
                            // ------------------------------------------

                            if (
                                isInvalidLandmarkName(
                                    firstName,
                                    item
                                )
                            ) {

                                console.warn(
                                    `[Landmarks] Rejected invalid place: ${firstName}`
                                );


                                return false;

                            }


                            // ------------------------------------------
                            // DUPLICATES
                            // ------------------------------------------

                            if (
                                seen.has(
                                    firstName
                                )
                            ) {

                                return false;

                            }


                            // ------------------------------------------
                            // BLACKLIST
                            // ------------------------------------------

                            const isBlacklisted =
                                blacklist.some(
                                    word =>
                                        fullName.includes(
                                            word
                                        ) ||
                                        itemClass.includes(
                                            word
                                        ) ||
                                        itemType.includes(
                                            word
                                        )
                                );


                            if (
                                isBlacklisted
                            ) {

                                console.warn(
                                    `[Landmarks] Rejected blacklisted place: ${firstName}`
                                );


                                return false;

                            }


                            // ------------------------------------------
                            // TOURIST CLASS
                            // ------------------------------------------

                            const isTouristClass =
                                [

                                    'tourism',
                                    'historic',
                                    'heritage',
                                    'amenity',
                                    'leisure',
                                    'natural'

                                ].includes(
                                    itemClass
                                );


                            // ------------------------------------------
                            // VALID LANDMARK
                            // ------------------------------------------

                            if (
                                item.importance > 0.4 ||
                                isTouristClass
                            ) {

                                seen.add(
                                    firstName
                                );


                                return true;

                            }


                            return false;

                        }
                    )

                    .slice(
                        0,
                        30
                    )

                    .map(
                        item => ({

                            name:
                                item.display_name
                                    .split(',')[0]
                                    .trim(),

                            address:
                                item.display_name,

                            type:
                                item.type,

                            class:
                                item.class,

                            importance:
                                item.importance,

                            lat:
                                item.lat,

                            lon:
                                item.lon

                        })
                    );


            // ==================================================
            // FINAL SAFETY FILTER
            // ==================================================

            const safeLandmarks =
                landmarks.filter(
                    landmark =>
                        !isInvalidLandmarkName(
                            landmark.name,
                            landmark
                        )
                );


            console.log(
                `[Landmarks] Found ${safeLandmarks.length} valid landmarks for ${cleanDestination}`
            );


            safeLandmarks
                .slice(0, 20)
                .forEach(
                    (landmark, index) => {

                        console.log(
                            `  ${index + 1}. ${landmark.name}`
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
                        safeLandmarks

                }
            );


            return safeLandmarks;


        } catch (error) {

            console.error(
                '[Landmarks] Search Error:',
                error.message
            );


            return [];

        }

    };


// ======================================================
// EXPORT
// ======================================================

module.exports = {

    resolveDestination,

    getCountryAndCurrency,

    searchLocations,

    getLandmarks,

    isInvalidLandmarkName

};