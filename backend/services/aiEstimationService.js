const axios = require('axios');

require('dotenv').config();


// ============================================================
// GEMINI CONFIGURATION
// ============================================================

const GEMINI_API_KEY =
    process.env.GEMINI_API_KEY;


const GEMINI_MODELS = [

    'gemini-3.7-flash',

    'gemini-3.6-flash',

    'gemini-3.5-flash',

    'gemini-2.5-flash',

    'gemini-2.5-flash-lite'

];


console.log(
    `[Gemini] API Key Present: ${!!GEMINI_API_KEY}`
);


// ============================================================
// SLEEP
// ============================================================

const sleep = (
    milliseconds
) => {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
    );
};


// ============================================================
// CLEAN JSON
// ============================================================

const cleanJson = (
    text
) => {

    if (!text) {

        throw new Error(
            'Gemini returned an empty response'
        );
    }


    let cleaned =
        text.trim();


    cleaned =
        cleaned.replace(
            /^```json\s*/i,
            ''
        );


    cleaned =
        cleaned.replace(
            /^```\s*/i,
            ''
        );


    cleaned =
        cleaned.replace(
            /\s*```$/i,
            ''
        );


    return cleaned.trim();
};


// ============================================================
// NORMALIZE PLACE NAME
// ============================================================

const normalizePlaceName = (
    name
) => {

    if (
        !name ||
        typeof name !== 'string'
    ) {

        return '';
    }


    return name
        .trim()
        .replace(
            /\s+/g,
            ' '
        )
        .toLowerCase();
};


// ============================================================
// CHECK WHETHER A PLACE NAME IS AN INTERNAL ID
// ============================================================

const isInternalPlaceId = (
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


    /*
     * Examples rejected:
     *
     * MDR32
     * MDR-32
     * POI123
     * POI-123
     * LOC45
     * REF12
     * ID123
     * PLACE42
     */

    const internalIdPattern =
        /^(?:MDR|POI|LOC|REF|ID|PLACE|LANDMARK|ATTRACTION)[-_]?\d+$/i;


    if (
        internalIdPattern.test(
            value
        )
    ) {

        return true;
    }


    /*
     * Generic uppercase/lowercase code:
     *
     * ABC123
     * XYZ45
     */

    if (
        /^[A-Z]{2,12}[-_]?\d{1,8}$/i.test(
            value
        )
    ) {

        return true;
    }


    /*
     * Pure numbers are never useful
     * as landmark names.
     */

    if (
        /^\d+$/.test(
            value
        )
    ) {

        return true;
    }


    return false;
};


// ============================================================
// VALIDATE REAL LANDMARK
// ============================================================

const isValidLandmarkObject = (
    place
) => {

    if (
        !place ||
        typeof place !== 'object'
    ) {

        return false;
    }


    const name =
        typeof place.name === 'string'
            ? place.name.trim()
            : '';


    if (!name) {

        return false;
    }


    if (
        isInternalPlaceId(
            name
        )
    ) {

        return false;
    }


    /*
     * Very short values are usually
     * not useful landmark names.
     */

    if (
        name.length < 3
    ) {

        return false;
    }


    return true;
};


// ============================================================
// CLEAN REAL LANDMARKS
// ============================================================

const cleanRealLandmarks = (
    groupedLandmarks
) => {

    if (
        !Array.isArray(
            groupedLandmarks
        )
    ) {

        return [];
    }


    return groupedLandmarks.map(
        dayPlaces => {

            if (
                !Array.isArray(
                    dayPlaces
                )
            ) {

                return [];
            }


            return dayPlaces
                .filter(
                    isValidLandmarkObject
                )
                .map(
                    place => ({

                        ...place,

                        name:
                            place.name.trim()

                    })
                );
        }
    );
};


// ============================================================
// FIND REAL LANDMARK
// ============================================================

const findMatchingRealPlace = (
    generatedPlace,
    realPlaces
) => {

    if (
        !generatedPlace ||
        !Array.isArray(
            realPlaces
        )
    ) {

        return null;
    }


    if (
        isInternalPlaceId(
            generatedPlace
        )
    ) {

        return null;
    }


    const generated =
        normalizePlaceName(
            generatedPlace
        );


    if (!generated) {

        return null;
    }


    /*
     * 1. Exact match
     */

    let match =
        realPlaces.find(
            place =>
                normalizePlaceName(
                    place.name
                ) === generated
        );


    if (match) {

        return match;
    }


    /*
     * 2. Generated name contains
     *    real landmark name
     */

    match =
        realPlaces.find(
            place => {

                const realName =
                    normalizePlaceName(
                        place.name
                    );


                return (
                    generated.includes(
                        realName
                    ) &&
                    realName.length >= 4
                );
            }
        );


    if (match) {

        return match;
    }


    /*
     * 3. Real landmark contains
     *    generated name
     */

    match =
        realPlaces.find(
            place => {

                const realName =
                    normalizePlaceName(
                        place.name
                    );


                return (
                    realName.includes(
                        generated
                    ) &&
                    generated.length >= 4
                );
            }
        );


    if (match) {

        return match;
    }


    return null;
};


// ============================================================
// VALIDATE GENERATED PLACE
// ============================================================

const isValidGeneratedPlace = (
    generatedPlace,
    realPlaces
) => {

    return Boolean(
        findMatchingRealPlace(
            generatedPlace,
            realPlaces
        )
    );
};


// ============================================================
// GEMINI REQUEST
// ============================================================

const generateGeminiContent = async (
    prompt
) => {

    if (!GEMINI_API_KEY) {

        throw new Error(
            'GEMINI_API_KEY is missing'
        );
    }


    let lastError = null;


    for (
        const model of GEMINI_MODELS
    ) {

        console.log(
            `\n[Gemini] Trying model: ${model}`
        );


        const url =
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;


        try {

            const response =
                await axios.post(

                    url,

                    {
                        contents: [
                            {
                                parts: [
                                    {
                                        text:
                                            prompt
                                    }
                                ]
                            }
                        ]
                    },

                    {
                        timeout:
                            45000,

                        headers: {

                            'Content-Type':
                                'application/json',

                            'x-goog-api-key':
                                GEMINI_API_KEY

                        }
                    }
                );


            const text =
                response
                    ?.data
                    ?.candidates?.[0]
                    ?.content
                    ?.parts?.[0]
                    ?.text;


            if (!text) {

                throw new Error(
                    'Gemini returned empty text'
                );
            }


            console.log(
                `[Gemini] ${model} succeeded`
            );


            return text;


        } catch (error) {

            lastError =
                error;


            const status =
                error.response?.status;


            console.error(
                `[Gemini] ${model} failed:`,
                error.message
            );


            if (status) {

                console.error(
                    `[Gemini] HTTP status: ${status}`
                );


                console.error(
                    JSON.stringify(
                        error.response.data,
                        null,
                        2
                    )
                );
            }


            const retryable =
                status === 429 ||
                status === 500 ||
                status === 502 ||
                status === 503 ||
                status === 504 ||
                error.code ===
                'ECONNABORTED' ||
                error.code ===
                'ETIMEDOUT';


            if (
                retryable
            ) {

                console.log(
                    '[Gemini] Trying next model...'
                );


                await sleep(
                    1000
                );


                continue;
            }


            throw error;
        }
    }


    throw (
        lastError ||
        new Error(
            'All Gemini models failed'
        )
    );
};


// ============================================================
// BUDGET ESTIMATION
// ============================================================

const estimateBudget = async ({
    destination,
    days,
    budget,
    travelType,
    currency
}) => {

    console.log(
        `\n[Budget] Starting budget estimation for ${destination}`
    );


    const totalBudget =
        Number(budget);


    if (
        !totalBudget ||
        totalBudget <= 0
    ) {

        throw new Error(
            'Invalid budget'
        );
    }


    let percentages;


    switch (
    String(
        travelType ||
        'budget'
    ).toLowerCase()
    ) {

        case 'luxury':

            percentages = {

                accommodation:
                    0.50,

                food:
                    0.20,

                transport:
                    0.10,

                activities:
                    0.15,

                miscellaneous:
                    0.05

            };

            break;


        case 'moderate':

        case 'standard':

        case 'comfortable':

            percentages = {

                accommodation:
                    0.40,

                food:
                    0.24,

                transport:
                    0.14,

                activities:
                    0.14,

                miscellaneous:
                    0.08

            };

            break;


        default:

            percentages = {

                accommodation:
                    0.32,

                food:
                    0.22,

                transport:
                    0.16,

                activities:
                    0.18,

                miscellaneous:
                    0.12

            };
    }


    const accommodation =
        Math.round(
            totalBudget *
            percentages.accommodation
        );


    const food =
        Math.round(
            totalBudget *
            percentages.food
        );


    const transport =
        Math.round(
            totalBudget *
            percentages.transport
        );


    const activities =
        Math.round(
            totalBudget *
            percentages.activities
        );


    const miscellaneous =
        totalBudget -
        accommodation -
        food -
        transport -
        activities;


    const result = {

        accommodation,

        food,

        transport,

        activities,

        miscellaneous,

        total:
            totalBudget

    };


    console.log(
        '[Budget] Budget estimation successful:'
    );


    console.log(
        result
    );


    return result;
};


// ============================================================
// GENERATE ITINERARY
// ============================================================

const generateItinerary = async ({
    destination,
    days,
    budget,
    travelType,
    landmarks = [],
    weather = null,
    currency = null
}) => {

    try {

        console.log(
            `\n[Gemini] Starting itinerary generation for ${destination}`
        );


        const numberOfDays =
            Number(days);


        if (
            !numberOfDays ||
            numberOfDays <= 0
        ) {

            throw new Error(
                'Invalid number of days'
            );
        }


        // ====================================================
        // CLEAN LANDMARK DATA
        // ====================================================

        const groupedLandmarks =
            cleanRealLandmarks(
                landmarks
            );


        const allLandmarks =
            groupedLandmarks.flat();


        console.log(
            `[Itinerary] Received ${landmarks.flat?.().length || 0} landmark entries`
        );


        console.log(
            `[Itinerary] ${allLandmarks.length} valid real landmarks after cleaning`
        );


        if (
            allLandmarks.length === 0
        ) {

            throw new Error(
                'No valid real landmarks available'
            );
        }


        /*
         * Log rejected IDs so you can see
         * exactly what was removed.
         */

        if (
            Array.isArray(
                landmarks
            )
        ) {

            landmarks
                .flat()
                .forEach(
                    place => {

                        if (
                            !isValidLandmarkObject(
                                place
                            )
                        ) {

                            console.warn(
                                `[Itinerary] Ignoring invalid landmark:`,
                                place?.name
                            );
                        }
                    }
                );
        }


        // ====================================================
        // GROUPED PLACES FOR GEMINI
        // ====================================================

        const groupedPlacesText =
            groupedLandmarks
                .map(
                    (
                        dayPlaces,
                        index
                    ) => {

                        const places =
                            Array.isArray(
                                dayPlaces
                            )
                                ? dayPlaces
                                : [];


                        if (
                            places.length === 0
                        ) {

                            return `
DAY ${index + 1}:

No specific landmarks available.
Choose rest/local exploration only.
`;
                        }


                        const text =
                            places
                                .map(
                                    (
                                        place,
                                        placeIndex
                                    ) => {

                                        return (
                                            `${placeIndex + 1}. ` +
                                            `${place.name} ` +
                                            `| ${place.distanceFromCenter || 0} km from center ` +
                                            `| ${place.type || place.class || 'attraction'}`
                                        );

                                    }
                                )
                                .join('\n');


                        return `
DAY ${index + 1} RECOMMENDED REAL PLACES:

${text}
`;
                    }
                )
                .join('\n');


        // ====================================================
        // WEATHER
        // ====================================================

        let weatherText =
            'Weather unavailable';


        if (
            weather
        ) {

            try {

                weatherText =
                    JSON.stringify(
                        weather
                    );

            } catch {

                weatherText =
                    'Weather unavailable';
            }
        }


        // ====================================================
        // CURRENCY
        // ====================================================

        let currencyText =
            'INR';


        if (
            currency
        ) {

            try {

                currencyText =
                    JSON.stringify(
                        currency
                    );

            } catch {

                currencyText =
                    'INR';
            }
        }


        // ====================================================
        // STRICT GEMINI PROMPT
        // ====================================================

        const prompt = `
You are an expert travel itinerary planner.

DESTINATION:
${destination}

TRIP LENGTH:
${numberOfDays} days

TOTAL BUDGET:
₹${budget}

TRAVEL TYPE:
${travelType || 'budget'}

CURRENCY:
${currencyText}

GEOGRAPHICALLY GROUPED REAL LANDMARKS:

${groupedPlacesText}

WEATHER:
${weatherText}


============================================================
CRITICAL PLACE-NAME RULES
============================================================

1. ONLY use real, human-readable place names from the
   supplied landmark list.

2. NEVER invent a landmark.

3. NEVER use a place from another city or destination.

4. NEVER use internal IDs.

5. NEVER use database identifiers.

6. NEVER use map/reference identifiers.

7. NEVER use codes such as:

   MDR32
   MDR-32
   POI123
   POI-123
   LOC45
   REF12
   ID123
   PLACE42
   ABC123

8. The "place" field MUST contain the actual human-readable
   landmark name.

9. If a landmark has an internal ID but no valid human-readable
   name, DO NOT use that landmark.

10. Do not create names from IDs.

11. Do not convert an ID into a fake landmark name.

12. If you cannot confidently identify a real place from the
    supplied list, DO NOT include that activity.

13. The activity.place value must match one of the supplied
    landmark names.

14. Preserve the original landmark spelling whenever possible.

15. Do not replace a real landmark name with a generic phrase
    such as "Local landmark", "Nearby attraction", "Scenic area",
    or "Local sightseeing".

16. Do not create fictional places.

17. Do not use road IDs, route IDs or reference numbers as
    attraction names.


============================================================
GEOGRAPHICAL RULES
============================================================

1. The destination is ONLY:
   ${destination}

2. Day 1 must prioritize places listed under DAY 1.

3. Day 2 must prioritize places listed under DAY 2.

4. Day 3 must prioritize places listed under DAY 3.

5. Continue this pattern for all available days.

6. Day 1 and Day 2 should contain the closest places.

7. Later days may progressively cover farther places.

8. Do not move far-away locations into Day 1 when nearby
   locations are available.

9. Keep geographically nearby places together.

10. Do not repeat the same attraction.

11. Maximum 3 major activities per day.


============================================================
GENERAL RULES
============================================================

1. Do not change the destination.

2. Do not invent exact opening hours.

3. Do not invent exact ticket prices.

4. Estimated costs are acceptable.

5. Keep descriptions concise.

6. Return ONLY valid JSON.

7. Do NOT return markdown.

8. Create exactly ${numberOfDays} day objects.


============================================================
OUTPUT FORMAT
============================================================

{
    "destination": "${destination}",

    "days": [
        {
            "day": 1,

            "title": "Day 1",

            "activities": [
                {
                    "time": "09:00 AM",

                    "place": "REAL LANDMARK NAME",

                    "activity": "Short description",

                    "duration": "2 hours",

                    "travelTimeFromPrevious": "15 minutes",

                    "distanceFromPrevious": "2 km",

                    "estimatedCost": 500
                }
            ],

            "dailyEstimatedCost": 3000
        }
    ],

    "totalEstimatedCost": ${Number(budget)},

    "tips": [
        "Travel tip"
    ]
}

Create exactly ${numberOfDays} days.
`;


        console.log(
            `[Gemini] Itinerary prompt length: ${prompt.length}`
        );


        // ====================================================
        // GEMINI
        // ====================================================

        const text =
            await generateGeminiContent(
                prompt
            );


        console.log(
            '[Gemini] Itinerary response received'
        );


        const cleaned =
            cleanJson(
                text
            );


        let itinerary;


        try {

            itinerary =
                JSON.parse(
                    cleaned
                );

        } catch (error) {

            console.error(
                '[Gemini] Invalid JSON:'
            );


            console.error(
                cleaned
            );


            throw new Error(
                'Gemini returned invalid JSON'
            );
        }


        // ====================================================
        // VALIDATE DAYS
        // ====================================================

        if (
            !Array.isArray(
                itinerary.days
            )
        ) {

            throw new Error(
                'Gemini did not return itinerary days'
            );
        }


        // ====================================================
        // VALIDATE AND REPLACE PLACES
        // ====================================================

        let removed =
            0;

        let corrected =
            0;


        itinerary.days =
            itinerary.days.map(
                (
                    day,
                    index
                ) => {

                    const activities =
                        Array.isArray(
                            day.activities
                        )
                            ? day.activities
                            : [];


                    const validActivities =
                        activities
                            .map(
                                activity => {

                                    if (
                                        !activity ||
                                        typeof activity !== 'object'
                                    ) {

                                        removed++;

                                        return null;
                                    }


                                    const generatedPlace =
                                        activity.place;


                                    const realPlace =
                                        findMatchingRealPlace(
                                            generatedPlace,
                                            allLandmarks
                                        );


                                    // --------------------------------
                                    // INVALID PLACE
                                    // --------------------------------

                                    if (
                                        !realPlace
                                    ) {

                                        console.warn(
                                            `[Itinerary] Removing invalid generated place: ${generatedPlace}`
                                        );


                                        removed++;

                                        return null;
                                    }


                                    /*
                                     * If Gemini returned a variation
                                     * of the real name, replace it
                                     * with the exact real landmark name.
                                     */

                                    if (
                                        normalizePlaceName(
                                            generatedPlace
                                        ) !==
                                        normalizePlaceName(
                                            realPlace.name
                                        )
                                    ) {

                                        console.log(
                                            `[Itinerary] Correcting place "${generatedPlace}" -> "${realPlace.name}"`
                                        );


                                        corrected++;
                                    }


                                    return {

                                        ...activity,

                                        place:
                                            realPlace.name

                                    };

                                }
                            )
                            .filter(
                                Boolean
                            );


                    return {

                        day:
                            index + 1,

                        title:
                            day.title ||
                            `Day ${index + 1}`,

                        activities:
                            validActivities,

                        dailyEstimatedCost:
                            Number(
                                day.dailyEstimatedCost
                            ) || 0

                    };
                }
            );


        console.log(
            `[Itinerary] Removed invalid places: ${removed}`
        );


        console.log(
            `[Itinerary] Corrected place names: ${corrected}`
        );


        // ====================================================
        // REMOVE DUPLICATE PLACES
        // ====================================================

        const usedPlaces =
            new Set();


        itinerary.days =
            itinerary.days.map(
                day => {

                    const uniqueActivities =
                        day.activities.filter(
                            activity => {

                                const normalized =
                                    normalizePlaceName(
                                        activity.place
                                    );


                                if (
                                    usedPlaces.has(
                                        normalized
                                    )
                                ) {

                                    console.warn(
                                        `[Itinerary] Removing duplicate place: ${activity.place}`
                                    );


                                    return false;
                                }


                                usedPlaces.add(
                                    normalized
                                );


                                return true;
                            }
                        );


                    return {

                        ...day,

                        activities:
                            uniqueActivities

                    };
                }
            );


        // ====================================================
        // ENSURE EXACT NUMBER OF DAYS
        // ====================================================

        while (
            itinerary.days.length <
            numberOfDays
        ) {

            itinerary.days.push({

                day:
                    itinerary.days.length + 1,

                title:
                    `Day ${itinerary.days.length + 1}`,

                activities: [],

                dailyEstimatedCost:
                    0

            });
        }


        if (
            itinerary.days.length >
            numberOfDays
        ) {

            itinerary.days =
                itinerary.days.slice(
                    0,
                    numberOfDays
                );
        }


        // ====================================================
        // FORCE DESTINATION
        // ====================================================

        itinerary.destination =
            destination;


        // ====================================================
        // TOTAL COST
        // ====================================================

        itinerary.totalEstimatedCost =
            Number(
                itinerary.totalEstimatedCost
            ) ||
            Number(
                budget
            );


        // ====================================================
        // TIPS
        // ====================================================

        if (
            !Array.isArray(
                itinerary.tips
            )
        ) {

            itinerary.tips = [];
        }


        // ====================================================
        // FINAL SAFETY CHECK
        // ====================================================

        /*
         * Final pass ensures that absolutely nothing
         * like MDR32 can reach the frontend.
         */

        itinerary.days =
            itinerary.days.map(
                day => ({

                    ...day,

                    activities:
                        day.activities.filter(
                            activity => {

                                const valid =
                                    isValidGeneratedPlace(
                                        activity.place,
                                        allLandmarks
                                    );


                                if (!valid) {

                                    console.error(
                                        `[FINAL VALIDATION] Blocked invalid place: ${activity.place}`
                                    );

                                }


                                return valid;

                            }
                        )

                })
            );


        console.log(
            '[Gemini] Itinerary generation successful'
        );


        console.log(
            '[Itinerary] Final itinerary:',
            JSON.stringify(
                itinerary,
                null,
                2
            )
        );


        return itinerary;


    } catch (error) {

        console.error(
            '[Gemini] Itinerary generation failed:',
            error.message
        );


        if (
            error.response
        ) {

            console.error(
                '[Gemini] HTTP Status:',
                error.response.status
            );


            console.error(
                '[Gemini] Response:',
                JSON.stringify(
                    error.response.data,
                    null,
                    2
                )
            );
        }


        throw new Error(
            'AI planning engine failed to generate an itinerary.'
        );
    }
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    estimateBudget,

    generateItinerary

};