const { GoogleGenAI } = require('@google/genai');

require('dotenv').config();


// ============================================================
// GEMINI CONFIGURATION
// ============================================================

const GEMINI_API_KEY =
    (process.env.GEMINI_API_KEY || '').trim();

const PRIMARY_MODEL =
    process.env.GEMINI_MODEL ||
    'gemini-3.6-flash';

const FALLBACK_MODELS = [
    'gemini-3-flash',
    'gemini-3.5-flash-lite',
    'gemini-3-flash-preview'
];

const GEMINI_MODELS = [
    PRIMARY_MODEL,
    ...FALLBACK_MODELS
].filter(
    (model, index, array) =>
        model &&
        array.indexOf(model) === index
);


let ai = null;

if (GEMINI_API_KEY) {

    ai = new GoogleGenAI({
        apiKey: GEMINI_API_KEY
    });

} else {

    console.warn(
        '[Gemini] GEMINI_API_KEY is missing'
    );

}


console.log(
    `[Gemini] API Key Present: ${!!GEMINI_API_KEY}`
);

console.log(
    `[Gemini] Primary model: ${PRIMARY_MODEL}`
);


// ============================================================
// CLEAN JSON
// ============================================================

const cleanJson = (text) => {

    if (!text) {

        throw new Error(
            'Gemini returned an empty response'
        );

    }

    let cleaned =
        String(text).trim();

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


    const firstBrace =
        cleaned.indexOf('{');

    const lastBrace =
        cleaned.lastIndexOf('}');


    if (
        firstBrace !== -1 &&
        lastBrace !== -1 &&
        lastBrace > firstBrace
    ) {

        cleaned =
            cleaned.substring(
                firstBrace,
                lastBrace + 1
            );

    }


    return cleaned.trim();

};


// ============================================================
// NORMALIZE PLACE
// ============================================================

const normalizePlaceName = (
    name
) => {

    return String(
        name || ''
    )
        .trim()
        .replace(
            /\s+/g,
            ' '
        )
        .toLowerCase();

};


// ============================================================
// INVALID PLACE CHECK
// ============================================================

const isInvalidPlaceName = (
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


    // Roads / internal IDs

    const invalidPattern =
        /^(?:MDR|NH|SH|MH|MP|UP|RJ|DL|KA|TN|KL|AP|TS|GJ|HR|PB|BR|WB|OD|JH|CG|UK|HP|JK|GA|AS|POI|LOC|REF|ID|PLACE|LANDMARK)[-_]?\d+$/i;


    if (
        invalidPattern.test(
            value
        )
    ) {

        return true;

    }


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
// CLEAN PLACES
// ============================================================

const cleanPlaces = (
    places
) => {

    if (
        !Array.isArray(places)
    ) {

        return [];

    }


    const result = [];

    const seen =
        new Set();


    for (
        const place of places
    ) {

        if (
            !place
        ) {

            continue;

        }


        const name =
            String(
                place.name ||
                ''
            ).trim();


        if (
            isInvalidPlaceName(
                name
            )
        ) {

            continue;

        }


        const key =
            normalizePlaceName(
                name
            );


        if (
            seen.has(
                key
            )
        ) {

            continue;

        }


        seen.add(
            key
        );


        result.push({

            name,

            importance:
                place.importance ||
                'important',

            category:
                place.category ||
                'attraction',

            description:
                place.description ||
                '',

            whyVisit:
                place.whyVisit ||
                '',

            recommendedDuration:
                place.recommendedDuration ||
                '1-2 hours'

        });

    }


    return result;

};


// ============================================================
// GEMINI ERROR HELPERS
// ============================================================

const getErrorStatus = (
    error
) => {

    return (
        error?.status ||
        error?.response?.status ||
        null
    );

};


const isModelError = (
    error
) => {

    const status =
        getErrorStatus(
            error
        );


    const message =
        String(
            error?.message ||
            ''
        ).toLowerCase();


    return (

        status === 404 ||

        message.includes(
            'model not found'
        ) ||

        message.includes(
            'not available'
        )

    );

};


// ============================================================
// GEMINI CALL
// ============================================================

const callGemini = async ({
    model,
    systemInstruction,
    prompt
}) => {

    if (
        !ai
    ) {

        throw new Error(
            'GEMINI_API_KEY is not configured'
        );

    }


    console.log(
        `[Gemini] Calling ${model}`
    );


    const response =
        await ai.models.generateContent({

            model,

            contents:
                prompt,

            config: {

                systemInstruction,

                temperature:
                    0.15,

                responseMimeType:
                    'application/json',

                maxOutputTokens:
                    6000

            }

        });


    const text =
        response?.text ||
        response
            ?.candidates?.[0]
            ?.content?.parts?.[0]
            ?.text ||
        '';


    if (
        !text.trim()
    ) {

        throw new Error(
            'Gemini returned an empty response'
        );

    }


    return text.trim();

};


// ============================================================
// GEMINI WITH FALLBACK
// ============================================================

const generateGeminiJson = async ({
    systemInstruction,
    prompt
}) => {

    let lastError =
        null;


    for (
        const model of GEMINI_MODELS
    ) {

        try {

            const result =
                await callGemini({

                    model,

                    systemInstruction,

                    prompt

                });


            console.log(
                `[Gemini] SUCCESS using ${model}`
            );


            return result;


        } catch (
        error
        ) {

            lastError =
                error;


            console.error(
                `[Gemini] ${model} failed:`,
                error.message
            );


            if (
                isModelError(
                    error
                )
            ) {

                continue;

            }


            /*
             * Try next model rather than
             * immediately killing the request.
             */

            continue;

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
// LOCAL CALCULATION
//
// IMPORTANT:
// This does NOT call Gemini.
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


    const total =
        Number(
            budget
        );


    if (
        !Number.isFinite(total) ||
        total <= 0
    ) {

        throw new Error(
            'Invalid budget'
        );

    }


    let percentages;


    switch (
    String(
        travelType ||
        'moderate'
    ).toLowerCase()
    ) {

        case 'budget':

            percentages = {

                accommodation:
                    0.25,

                food:
                    0.25,

                transport:
                    0.20,

                activities:
                    0.15,

                miscellaneous:
                    0.15

            };

            break;


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


        default:

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

    }


    const accommodation =
        Math.round(
            total *
            percentages.accommodation
        );


    const food =
        Math.round(
            total *
            percentages.food
        );


    const transport =
        Math.round(
            total *
            percentages.transport
        );


    const activities =
        Math.round(
            total *
            percentages.activities
        );


    const miscellaneous =
        total -
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

        total

    };


    console.log(
        '[Budget] Budget estimation successful:',
        result
    );


    return result;

};


// ============================================================
// GENERATE ITINERARY
//
// ONE GEMINI CALL
//
// Gemini:
// 1. Understands destination
// 2. Identifies popular places
// 3. Creates itinerary
//
// NO OSM
// NO NOMINATIM
// ============================================================

const generateItinerary = async ({
    destination,
    days,
    budget,
    travelType,
    currency,
    startDate = null
}) => {

    console.log(
        `\n[Itinerary] Starting AI planning for ${destination}`
    );


    const numberOfDays =
        Number(days);


    const totalBudget =
        Number(budget);


    if (
        !Number.isInteger(
            numberOfDays
        ) ||
        numberOfDays <= 0
    ) {

        throw new Error(
            'Invalid number of days'
        );

    }


    if (
        !Number.isFinite(
            totalBudget
        ) ||
        totalBudget <= 0
    ) {

        throw new Error(
            'Invalid budget'
        );

    }


    // ========================================================
    // LOCAL BUDGET
    // ========================================================

    const budgetBreakdown =
        await estimateBudget({

            destination,

            days:
                numberOfDays,

            budget:
                totalBudget,

            travelType,

            currency

        });


    // ========================================================
    // SAME TRAVEL ASSISTANT STYLE AS CHATBOT
    // ========================================================

    const systemInstruction = `

You are VoyageAI Assistant.

You are the same intelligent travel assistant
used by our travel chatbot.

You are highly knowledgeable about:

- destinations
- tourist attractions
- famous places
- temples
- historical sites
- monuments
- natural attractions
- viewpoints
- cultural attractions
- things to do
- travel planning
- itineraries

Understand the destination naturally using your
travel knowledge.

The destination may be a city, town, district,
region, state or country.

Your first priority is to identify the places
that a knowledgeable travel assistant would
actually recommend.

IMPORTANT:

Do NOT use OpenStreetMap.

Do NOT use Nominatim.

Do NOT use road IDs.

Do NOT use MDR/NH/SH codes.

Do NOT invent machine IDs.

Do NOT create random attractions simply to fill
the itinerary.

Return ONLY valid JSON.

`;


    // ========================================================
    // SINGLE REQUEST
    // ========================================================

    const prompt = `

I am planning a trip.

Destination:
"${destination}"

Number of days:
${numberOfDays}

Budget:
₹${totalBudget}

Travel type:
${travelType || 'moderate'}

Start date:
${startDate || 'Not specified'}


========================================================
STEP 1 — UNDERSTAND THE DESTINATION
========================================================

Think exactly like a knowledgeable travel chatbot.

If a user asked:

"What are all the places I can cover in
${destination}?"

determine the important places that should
actually be recommended.

Prioritize:

1. Most famous attractions
2. Major landmarks
3. Important religious places
4. Major historical places
5. Important natural attractions
6. Popular cultural attractions
7. Good secondary attractions


========================================================
STEP 2 — POPULAR PLACES
========================================================

Create a list of the important tourist places.

Do NOT choose random locations.

The first places must be the most important
and popular attractions.

If the destination has many attractions,
identify approximately 8-15 useful places.

If it genuinely has fewer attractions,
return fewer.


========================================================
STEP 3 — CREATE ITINERARY
========================================================

Create exactly ${numberOfDays} days.

Use the popular places identified in Step 1.

Major attractions MUST receive priority.

Do not leave major attractions unused merely
because a secondary attraction is closer.


========================================================
GEOGRAPHY
========================================================

Arrange places logically.

Keep nearby places together where possible.

Avoid unnecessary backtracking.

However:

POPULARITY > small distance difference.


========================================================
DAILY PACE
========================================================

Travel type:

${travelType || 'moderate'}


For moderate travel:

2-3 major attractions per day.

For budget travel:

Prefer free/low-cost attractions.

For luxury travel:

Allow comfortable pacing and premium
experiences.


========================================================
TIMINGS
========================================================

Use realistic visiting times.

Example:

07:00 AM
09:00 AM
11:30 AM
01:30 PM
03:30 PM
05:30 PM
07:00 PM

Do not create impossible schedules.


========================================================
BUDGET
========================================================

Total budget:

₹${totalBudget}

Budget breakdown:

${JSON.stringify(
        budgetBreakdown,
        null,
        2
    )}

Stay approximately within this budget.

Free attractions:

estimatedCost = 0


========================================================
IMPORTANT
========================================================

The requested destination is:

"${destination}"

It MUST remain the primary destination.

Do not silently change it to another city.

Nearby places can only be included if they
genuinely make sense for the trip.


========================================================
NO DUPLICATES
========================================================

Never use the same attraction twice.


========================================================
NO FAKE IDS
========================================================

Never output:

MDR235
MDR234
MDR226
NH333
NH44
SH12
POI123
LOC123
REF123
ID123


========================================================
OUTPUT
========================================================

Return ONLY this JSON:

{
    "destination": "${destination}",

    "popularPlaces": [

        {
            "name": "Actual famous attraction",

            "importance": "major",

            "category": "temple",

            "description": "Short description",

            "whyVisit": "Why it is worth visiting"
        }

    ],

    "days": [

        {
            "day": 1,

            "title": "Day 1",

            "theme": "Daily theme",

            "activities": [

                {
                    "time": "08:00 AM",

                    "place": "Actual attraction",

                    "activity": "What to do",

                    "duration": "2 hours",

                    "travelTimeFromPrevious":
                        "15 minutes",

                    "distanceFromPrevious":
                        "3 km",

                    "estimatedCost": 0
                }

            ],

            "dailyEstimatedCost": 5000
        }

    ],

    "budgetBreakdown": {

        "accommodation":
            ${budgetBreakdown.accommodation},

        "food":
            ${budgetBreakdown.food},

        "transport":
            ${budgetBreakdown.transport},

        "activities":
            ${budgetBreakdown.activities},

        "miscellaneous":
            ${budgetBreakdown.miscellaneous},

        "total":
            ${budgetBreakdown.total}
    },

    "totalEstimatedCost":
        ${totalBudget},

    "tips": [

        "Useful travel tip"

    ]

}


========================================================
FINAL CHECK
========================================================

Before responding:

1. Exactly ${numberOfDays} days.

2. Identify popular attractions first.

3. Use the most famous attractions in the
   itinerary.

4. Keep the requested destination as primary.

5. No duplicate attractions.

6. No road IDs.

7. No MDR/NH/SH codes.

8. No invented machine IDs.

9. Realistic daily schedule.

10. Budget approximately ₹${totalBudget}.

11. Return ONLY JSON.

`;


    console.log(
        '[Itinerary] Sending ONE Gemini request...'
    );


    const start =
        Date.now();


    const text =
        await generateGeminiJson({

            systemInstruction,

            prompt

        });


    console.log(
        `[Itinerary] Gemini completed in ${Date.now() - start} ms`
    );


    // ========================================================
    // PARSE
    // ========================================================

    let itinerary;


    try {

        itinerary =
            JSON.parse(
                cleanJson(
                    text
                )
            );

    } catch (
    error
    ) {

        console.error(
            '[Itinerary] Invalid Gemini JSON:'
        );

        console.error(
            text
        );

        throw new Error(
            'Gemini returned invalid itinerary JSON'
        );

    }


    // ========================================================
    // EXACT DAYS
    // ========================================================

    if (
        !Array.isArray(
            itinerary.days
        )
    ) {

        throw new Error(
            'Gemini did not return days'
        );

    }


    itinerary.days =
        itinerary.days.slice(
            0,
            numberOfDays
        );


    while (
        itinerary.days.length <
        numberOfDays
    ) {

        itinerary.days.push({

            day:
                itinerary.days.length + 1,

            title:
                `Day ${itinerary.days.length + 1}`,

            theme:
                'Local exploration',

            activities: [],

            dailyEstimatedCost:
                0

        });

    }


    // ========================================================
    // REMOVE DUPLICATES
    // ========================================================

    const usedPlaces =
        new Set();


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


                const cleanedActivities =
                    activities.filter(
                        activity => {

                            if (
                                !activity ||
                                !activity.place
                            ) {

                                return false;

                            }


                            const name =
                                String(
                                    activity.place
                                ).trim();


                            if (
                                isInvalidPlaceName(
                                    name
                                )
                            ) {

                                console.warn(
                                    `[Itinerary] Removed invalid place: ${name}`
                                );

                                return false;

                            }


                            const key =
                                normalizePlaceName(
                                    name
                                );


                            if (
                                usedPlaces.has(
                                    key
                                )
                            ) {

                                console.warn(
                                    `[Itinerary] Removed duplicate: ${name}`
                                );

                                return false;

                            }


                            usedPlaces.add(
                                key
                            );


                            return true;

                        }
                    );


                return {

                    ...day,

                    day:
                        index + 1,

                    activities:
                        cleanedActivities

                };

            }
        );


    // ========================================================
    // FINAL VALUES
    // ========================================================

    itinerary.destination =
        destination;


    itinerary.budgetBreakdown =
        budgetBreakdown;


    itinerary.totalEstimatedCost =
        totalBudget;


    if (
        !Array.isArray(
            itinerary.popularPlaces
        )
    ) {

        itinerary.popularPlaces = [];

    }


    if (
        !Array.isArray(
            itinerary.tips
        )
    ) {

        itinerary.tips = [];

    }


    // ========================================================
    // LOG
    // ========================================================

    console.log(
        '\n[Itinerary] POPULAR PLACES'
    );


    itinerary.popularPlaces.forEach(
        (
            place,
            index
        ) => {

            console.log(
                `  ${index + 1}. ${place.name}`
            );

        }
    );


    console.log(
        '\n[Itinerary] FINAL RESULT'
    );


    itinerary.days.forEach(
        day => {

            console.log(
                `\nDay ${day.day}: ${day.title}`
            );


            day.activities.forEach(
                activity => {

                    console.log(
                        `  ${activity.time} → ${activity.place}`
                    );

                }
            );

        }
    );


    console.log(
        `\n[Itinerary] Total budget: ₹${totalBudget}`
    );


    return itinerary;

};


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    estimateBudget,

    generateItinerary

};