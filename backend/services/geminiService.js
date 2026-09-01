const {
    GoogleGenerativeAI
} = require('@google/generative-ai');

const axios =
    require('axios');

require('dotenv').config();


// ======================================================
// GEMINI CONFIGURATION
// ======================================================

console.log(
    'Gemini Service Loaded. Key Present:',
    !!process.env.GEMINI_API_KEY
);


// ======================================================
// MODEL LIST
// ======================================================

const getGeminiModels = () => {

    const primary =
        (
            process.env.GEMINI_MODEL ||
            'gemini-3-flash'
        ).trim();


    const fallbackString =
        (
            process.env.GEMINI_FALLBACK_MODELS ||
            'gemini-2.5-flash,gemini-2.0-flash'
        ).trim();


    const fallbacks =
        fallbackString
            ? fallbackString
                .split(',')
                .map(
                    model =>
                        model.trim()
                )
                .filter(Boolean)
            : [];


    return [
        primary,
        ...fallbacks
    ]
        .filter(
            (model, index, array) =>
                array.indexOf(model) === index
        );

};


// ======================================================
// GENERATE ITINERARY
// ======================================================

const generateItineraryWithGemini = async ({
    destination,
    days,
    travelType,
    budget,
    travelers,
    interests,
    pace,
    weatherForecast,
    primaryPlaces = [],
    nearbyPlaces = [],
    candidatePlaces = []
}) => {

    const apiKey =
        (
            process.env.GEMINI_API_KEY ||
            ''
        ).trim();


    if (
        !apiKey ||
        apiKey === 'your_new_gemini_api_key_here' ||
        apiKey === 'your_key_here'
    ) {

        console.warn(
            '[Gemini] API key missing or placeholder.'
        );

        return null;

    }


    // ==================================================
    // BACKWARD COMPATIBILITY
    // ==================================================

    if (
        primaryPlaces.length === 0 &&
        candidatePlaces.length > 0
    ) {

        primaryPlaces =
            candidatePlaces;

    }


    // ==================================================
    // PREPARE PRIMARY PLACES
    // ==================================================

    const primaryContext =
        primaryPlaces.map(
            place => ({

                placeId:
                    place.placeId,

                name:
                    place.name,

                latitude:
                    place.latitude,

                longitude:
                    place.longitude,

                rating:
                    place.rating,

                category:
                    place.category,

                address:
                    place.address,

                types:
                    place.types,

                distanceFromDestinationKm:
                    place.distanceFromDestinationKm,

                destinationRelevanceScore:
                    place.destinationRelevanceScore

            })
        );


    // ==================================================
    // PREPARE NEARBY PLACES
    // ==================================================

    const nearbyContext =
        nearbyPlaces.map(
            place => ({

                placeId:
                    place.placeId,

                name:
                    place.name,

                latitude:
                    place.latitude,

                longitude:
                    place.longitude,

                rating:
                    place.rating,

                category:
                    place.category,

                address:
                    place.address,

                types:
                    place.types,

                distanceFromDestinationKm:
                    place.distanceFromDestinationKm,

                destinationRelevanceScore:
                    place.destinationRelevanceScore

            })
        );


    // ==================================================
    // PROMPT
    // ==================================================

    const prompt = `

You are VoyageAI, a professional travel planning and itinerary optimization engine.

You MUST use ONLY the verified places supplied below.

You are NOT a geographic database.

Do NOT invent, hallucinate, rename, substitute, or create any location.

Every activity MUST use a valid placeId from the supplied places.

==================================================
TRIP DETAILS
==================================================

Destination:
${destination}

Duration:
${days} days

Budget:
${budget} INR

Travelers:
${travelers}

Travel Type:
${travelType}

Interests:
${interests.join(', ')}

Preferred Pace:
${pace}

==================================================
WEATHER
==================================================

${JSON.stringify(
        weatherForecast,
        null,
        2
    )}

==================================================
PRIMARY DESTINATION PLACES
==================================================

These places are inside or very close to the requested destination.

THESE HAVE PRIORITY.

${JSON.stringify(
        primaryContext,
        null,
        2
    )}

==================================================
NEARBY / SIDE-TRIP PLACES
==================================================

These places are outside the main destination but may be suitable for a day trip.

${JSON.stringify(
        nearbyContext,
        null,
        2
    )}

==================================================
PLANNING RULES
==================================================

1. Generate exactly ${days} days.

2. PRIMARY DESTINATION PLACES MUST HAVE PRIORITY.

3. Do not replace major primary attractions with nearby destinations.

4. Schedule the most important primary attractions first.

5. If there are enough days, a nearby destination can be included as a side trip.

6. Nearby destinations such as national parks, towns, viewpoints or attractions can be used as a complete day trip when appropriate.

7. Do NOT include a nearby attraction simply because it has a high rating.

8. Consider distance and travel time.

9. Avoid unnecessary backtracking.

10. Group geographically close attractions together.

11. Do not repeat the same place.

12. Respect the user's interests.

13. Respect the user's preferred pace.

14. Relaxed:
    1-2 activities per day.

15. Moderate:
    2-3 activities per day.

16. Packed:
    3-4 activities per day.

17. Use weather conditions intelligently.

18. Outdoor attractions are preferred during suitable weather.

19. Indoor attractions should be preferred during significant rain.

20. A nearby destination may occupy most or all of a day if it is a meaningful excursion.

21. Do not invent travel times.

22. travelFromPreviousMinutes MUST initially be 0.
    The backend will calculate the actual route later.

23. The "name" MUST exactly match the supplied place.

24. The "placeId" MUST exactly match one of the supplied placeIds.

==================================================
IMPORTANT DESTINATION PRIORITY
==================================================

For a destination such as Nainital:

Primary attractions such as:

- Naina Devi Temple
- Nainital Lake
- Mall Road
- Snow View Point
- Tiffin Top

should normally be considered before nearby destinations such as:

- Jim Corbett
- Ramnagar

However, Jim Corbett and other nearby destinations MUST remain available as optional side trips when the trip duration allows it.

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Structure:

{
    "destination": "${destination}",
    "summary": "Short 1-2 sentence description.",
    "days": [
        {
            "day": 1,
            "date": "YYYY-MM-DD",
            "theme": "Daily theme",
            "activities": [
                {
                    "placeId": "valid supplied placeId",
                    "name": "Exact supplied place name",
                    "startTime": "HH:MM",
                    "endTime": "HH:MM",
                    "durationMinutes": 60,
                    "travelFromPreviousMinutes": 0,
                    "reason": "Why this place is suitable."
                }
            ]
        }
    ]
}

The days array MUST contain exactly ${days} days.

Output ONLY JSON.
`;


    // ==================================================
    // MODELS
    // ==================================================

    const models =
        getGeminiModels();


    console.log(
        '[Gemini] Available models:',
        models.join(', ')
    );


    // ==================================================
    // TRY EACH MODEL
    // ==================================================

    for (
        let index = 0;
        index < models.length;
        index++
    ) {

        const modelName =
            models[index];


        console.log(
            `[Gemini] Trying model ${index + 1}/${models.length}: ${modelName}`
        );


        // ==================================================
        // SDK ATTEMPT
        // ==================================================

        try {

            const genAI =
                new GoogleGenerativeAI(
                    apiKey
                );


            const model =
                genAI.getGenerativeModel({

                    model:
                        modelName,

                    generationConfig: {

                        responseMimeType:
                            'application/json',

                        temperature:
                            0.2

                    }

                });


            console.log(
                `[Gemini] Starting SDK generation with ${modelName}`
            );


            const result =
                await model.generateContent(
                    prompt
                );


            const response =
                await result.response;


            const text =
                response.text();


            const parsed =
                parseGeminiJSON(
                    text
                );


            if (
                parsed
            ) {

                console.log(
                    `[Gemini] SUCCESS using ${modelName}`
                );

                return parsed;

            }


            throw new Error(
                'Gemini returned invalid JSON'
            );


        } catch (sdkError) {

            console.error(
                `[Gemini] SDK failed for ${modelName}:`,
                sdkError.message
            );


            // ==================================================
            // REST FALLBACK FOR THE SAME MODEL
            // ==================================================

            try {

                console.log(
                    `[Gemini] Trying REST API for ${modelName}`
                );


                const url =
                    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;


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

                            ],

                            generationConfig: {

                                responseMimeType:
                                    'application/json',

                                temperature:
                                    0.2

                            }

                        },

                        {

                            headers: {

                                'Content-Type':
                                    'application/json'

                            },

                            timeout:
                                45000

                        }

                    );


                const text =
                    response
                        .data
                        ?.candidates?.[0]
                        ?.content?.parts?.[0]
                        ?.text;


                const parsed =
                    parseGeminiJSON(
                        text
                    );


                if (
                    parsed
                ) {

                    console.log(
                        `[Gemini] REST SUCCESS using ${modelName}`
                    );

                    return parsed;

                }


                throw new Error(
                    'REST API returned invalid JSON'
                );


            } catch (restError) {

                console.error(
                    `[Gemini] REST failed for ${modelName}:`,
                    restError.message
                );

            }

        }


        // ==================================================
        // MOVE TO NEXT MODEL
        // ==================================================

        if (
            index <
            models.length - 1
        ) {

            console.log(
                `[Gemini] ${modelName} failed. Switching to ${models[index + 1]}...`
            );

        }

    }


    console.error(
        '[Gemini] All configured models failed.'
    );


    return null;

};


// ======================================================
// PARSE JSON
// ======================================================

const parseGeminiJSON = (
    text
) => {

    if (
        !text ||
        typeof text !== 'string'
    ) {

        return null;

    }


    try {

        return JSON.parse(
            text
        );

    } catch (error) {

        console.log(
            '[Gemini] Direct JSON parse failed. Attempting extraction.'
        );

    }


    const jsonMatch =
        text.match(
            /\{[\s\S]*\}/
        );


    if (
        !jsonMatch
    ) {

        return null;

    }


    try {

        return JSON.parse(
            jsonMatch[0]
        );

    } catch (error) {

        console.error(
            '[Gemini] Extracted JSON parse failed:',
            error.message
        );

        return null;

    }

};


// ======================================================
// EXPORT
// ======================================================

module.exports = {
    generateItineraryWithGemini
};