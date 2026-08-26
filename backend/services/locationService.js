const axios = require('axios');
require('dotenv').config();


// ======================================================
// CONFIGURATION
// ======================================================

const NOMINATIM_URL =
    'https://nominatim.openstreetmap.org';

const NOMINATIM_DELAY = 1100; // ~1 request/sec


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


// Cache duration
// 1 hour

const CACHE_DURATION =
    60 * 60 * 1000;


// ======================================================
// NOMINATIM REQUEST QUEUE
// ======================================================

let lastNominatimRequest = 0;

let nominatimQueue =
    Promise.resolve();


const wait = (ms) =>
    new Promise(resolve =>
        setTimeout(resolve, ms)
    );


const queueNominatimRequest = (
    requestFunction
) => {

    const run = nominatimQueue.then(
        async () => {

            const now =
                Date.now();

            const elapsed =
                now - lastNominatimRequest;

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

    // Keep queue alive even if one request fails

    nominatimQueue =
        run.catch(() => { });

    return run;
};


// ======================================================
// NOMINATIM REQUEST WITH RETRY
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
                                    'VoyageAI/1.0 (travel-planner)'
                            },

                            timeout
                        }
                    );

                }
            );

        } catch (error) {

            const status =
                error.response?.status;


            // ------------------------------------------
            // Rate limited
            // ------------------------------------------

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
            String(placeName || '')
                .trim();


        if (!cleanPlace) {

            throw new Error(
                'Place name is required'
            );

        }


        const cacheKey =
            cleanPlace.toLowerCase();


        // ------------------------------------------
        // CACHE CHECK
        // ------------------------------------------

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

            // ------------------------------------------
            // Nominatim
            // ------------------------------------------

            const geoResponse =
                await nominatimRequest(
                    {
                        q: cleanPlace,
                        format: 'json',
                        addressdetails: 1,
                        limit: 1
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
                location.address || {};


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


            // ------------------------------------------
            // CURRENCY
            //
            // First use local map.
            // ------------------------------------------

            let currencyCode =
                countryCurrencyMap[
                countryCode
                ];


            // ------------------------------------------
            // Fallback to countries.dev
            // ------------------------------------------

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
                        countryResponse.data
                            ?.currencies;


                    if (
                        currencies &&
                        currencies.length > 0
                    ) {

                        currencyCode =
                            currencies[0].code;

                    }

                } catch (currencyError) {

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


            console.log(
                `Currency resolved: ${countryCode} -> ${currencyCode}`
            );


            // ------------------------------------------
            // Parent location
            // ------------------------------------------

            const parentLocation =
                address.city ||
                address.town ||
                address.village ||
                address.municipality ||
                address.county ||
                countryName;


            const resolvedName =
                location.display_name
                    ?.split(',')[0]
                    ?.trim() ||
                cleanPlace;


            const result = {

                countryCode,

                countryName,

                resolvedName,

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


            // ------------------------------------------
            // SAVE CACHE
            // ------------------------------------------

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
//
// Used by BOTH:
//
// PlanTrip
// Trends
//
// This is the important endpoint for your dropdown.
// ======================================================

const searchLocations =
    async (query) => {

        const cleanQuery =
            String(query || '')
                .trim();


        if (
            cleanQuery.length < 3
        ) {

            return [];

        }


        const cacheKey =
            cleanQuery.toLowerCase();


        // ------------------------------------------
        // CACHE
        // ------------------------------------------

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

            console.log(
                `Search cache hit: ${cleanQuery}`
            );

            return cached.data;

        }


        try {

            console.log(
                `Nominatim search: ${cleanQuery}`
            );


            const response =
                await nominatimRequest(
                    {
                        q:
                            cleanQuery,

                        format:
                            'json',

                        addressdetails:
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
                    item => ({

                        display_name:
                            item.display_name,

                        name:
                            item.name,

                        lat:
                            item.lat,

                        lon:
                            item.lon,

                        type:
                            item.type,

                        country:
                            item.address
                                ?.country,

                        countryCode:
                            item.address
                                ?.country_code
                                ?.toUpperCase()

                    })
                );


            // ------------------------------------------
            // SAVE CACHE
            // ------------------------------------------

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


            // Don't crash frontend

            return [];

        }

    };


// ======================================================
// LANDMARKS
// ======================================================

const getLandmarks =
    async (destination) => {

        const cleanDestination =
            String(destination || '')
                .trim();


        if (!cleanDestination) {

            return [];

        }


        const cacheKey =
            cleanDestination.toLowerCase();


        // ------------------------------------------
        // CACHE
        // ------------------------------------------

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


            let allLandmarks = [];


            /*
             * IMPORTANT:
             *
             * Do NOT use Promise.all here.
             *
             * Promise.all would send 13 simultaneous
             * Nominatim requests and cause 429.
             */

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
                        `Landmark category failed: ${category}`,
                        error.message
                    );

                }


                /*
                 * Stop early once we have enough.
                 */

                if (
                    allLandmarks.length >= 30
                ) {

                    break;

                }

            }


            // ------------------------------------------
            // Broader search if necessary
            // ------------------------------------------

            if (
                allLandmarks.length < 15
            ) {

                try {

                    const broaderResponse =
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
                        ...(broaderResponse.data || [])
                    );


                } catch (error) {

                    console.warn(
                        'Broader landmark search failed:',
                        error.message
                    );

                }

            }


            if (
                allLandmarks.length === 0
            ) {

                return [];

            }


            // ------------------------------------------
            // BLACKLIST
            // ------------------------------------------

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


            const landmarks =
                allLandmarks

                    .sort(
                        (a, b) =>
                            (b.importance || 0) -
                            (a.importance || 0)
                    )

                    .filter(item => {

                        const fullName =
                            (
                                item.display_name ||
                                ''
                            ).toLowerCase();


                        const firstName =
                            (
                                item.display_name ||
                                ''
                            )
                                .split(',')[0]
                                .trim();


                        const itemClass =
                            (
                                item.class ||
                                ''
                            ).toLowerCase();


                        const itemType =
                            (
                                item.type ||
                                ''
                            ).toLowerCase();


                        if (
                            seen.has(firstName)
                        ) {

                            return false;

                        }


                        if (
                            firstName.length < 3
                        ) {

                            return false;

                        }


                        const isBlacklisted =
                            blacklist.some(
                                word =>
                                    fullName.includes(word) ||
                                    itemClass.includes(word) ||
                                    itemType.includes(word)
                            );


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


                        if (
                            !isBlacklisted &&
                            (
                                item.importance > 0.4 ||
                                isTouristClass
                            )
                        ) {

                            seen.add(
                                firstName
                            );

                            return true;

                        }


                        return false;

                    })

                    .slice(0, 30)

                    .map(item => ({

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

                    }));


            // ------------------------------------------
            // CACHE
            // ------------------------------------------

            landmarkCache.set(
                cacheKey,
                {
                    timestamp:
                        Date.now(),

                    data:
                        landmarks
                }
            );


            return landmarks;


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