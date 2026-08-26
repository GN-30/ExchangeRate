const {
    estimateBudget,
    generateItinerary
} = require('../services/aiEstimationService');

const {
    getCountryAndCurrency,
    getLandmarks
} = require('../services/locationService');

const {
    getExchangeRate
} = require('../services/exchangeRateService');

const {
    groupLandmarksByDistance
} = require('../services/landmarkGroupingService');

const db = require('../db');
const jwt = require('jsonwebtoken');


// ============================================================
// CALCULATE ITINERARY
// ============================================================

const calculateItinerary = async (req, res) => {

    try {

        console.log('\n====================================');
        console.log('[Itinerary Controller] New request');
        console.log('Request body:', req.body);


        let {
            destination,
            days,
            budgetINR,
            budget,
            travelType
        } = req.body;


        // ====================================================
        // KEEP THE EXACT PLACE ENTERED BY THE USER
        // ====================================================

        if (!destination) {

            return res.status(400).json({
                error: 'Destination is required'
            });

        }

        const searchedPlace =
            String(destination).trim();


        // ====================================================
        // DEFAULT BUDGET
        // ====================================================

        if (
            !budgetINR ||
            Number(budgetINR) <= 0
        ) {

            const budgetMap = {
                Budget: 5000,
                Medium: 10000,
                High: 20000,
                Luxury: 50000
            };

            const perDay =
                budgetMap[budget] ||
                10000;

            budgetINR =
                Number(days || 3) *
                perDay;

            console.log(
                `[Itinerary Controller] Calculated default budgetINR: ₹${budgetINR}`
            );
        }


        console.log(
            '[Itinerary Controller] User entered place:',
            searchedPlace
        );

        console.log(
            '[Itinerary Controller] Days:',
            days
        );

        console.log(
            '[Itinerary Controller] Final Budget INR:',
            budgetINR
        );

        console.log(
            '[Itinerary Controller] Travel type:',
            travelType
        );


        // ====================================================
        // VALIDATION
        // ====================================================

        if (
            !days ||
            Number(days) <= 0
        ) {

            return res.status(400).json({
                error: 'Invalid number of days'
            });

        }


        if (
            !budgetINR ||
            Number(budgetINR) <= 0
        ) {

            return res.status(400).json({
                error: 'Invalid budget amount'
            });

        }


        // ====================================================
        // RESOLVE LOCATION
        // ====================================================

        console.log(
            '[Itinerary Controller] Resolving location...'
        );


        const location =
            await getCountryAndCurrency(
                searchedPlace
            );


        console.log(
            '[Itinerary Controller] Location resolved:',
            location
        );


        /*
         * IMPORTANT
         *
         * resolvedPlace = actual place
         *
         * countryName = country
         *
         * We NEVER use countryName as the destination.
         */

        const resolvedPlace =
            (
                location.resolvedName &&
                String(
                    location.resolvedName
                ).trim()
            )
                ? String(
                    location.resolvedName
                ).trim()
                : searchedPlace;


        /*
         * This is ONLY for the AI.
         *
         * Example:
         *
         * resolvedPlace = Nainital
         * countryName   = India
         *
         * AI receives:
         *
         * Nainital, India
         */

        const itineraryDestination =
            `${resolvedPlace}, ${location.countryName}`;


        console.log(
            '[Itinerary Controller] PLACE:',
            resolvedPlace
        );

        console.log(
            '[Itinerary Controller] COUNTRY:',
            location.countryName
        );

        console.log(
            '[Itinerary Controller] AI destination:',
            itineraryDestination
        );


        // ====================================================
        // EXCHANGE RATE
        // ====================================================

        console.log(
            '[Itinerary Controller] Fetching exchange rate...'
        );


        const rate =
            await getExchangeRate(
                location.currencyCode
            );


        console.log(
            `[Itinerary Controller] INR → ${location.currencyCode}: ${rate}`
        );


        // ====================================================
        // BUDGET ESTIMATION
        // ====================================================

        console.log(
            '[Itinerary Controller] Starting budget estimation...'
        );


        const budgetResult =
            await estimateBudget({

                destination:
                    itineraryDestination,

                days:
                    Number(days),

                budget:
                    Number(budgetINR),

                travelType,

                currency:
                    location.currencyCode

            });


        console.log(
            '[Itinerary Controller] Budget result:',
            budgetResult
        );


        // ====================================================
        // REAL LANDMARKS
        // ====================================================

        console.log(
            '[Itinerary Controller] Fetching real landmarks...'
        );


        const landmarks =
            await getLandmarks(
                resolvedPlace
            );


        console.log(
            `[Itinerary Controller] Found ${landmarks.length} landmarks`
        );


        if (
            !landmarks ||
            landmarks.length === 0
        ) {

            return res.status(404).json({

                error:
                    `No real landmarks found for ${resolvedPlace}`

            });

        }


        // ====================================================
        // GEOGRAPHICAL GROUPING
        // ====================================================

        console.log(
            '[Itinerary Controller] Grouping landmarks geographically...'
        );


        const groupedLandmarks =
            groupLandmarksByDistance(
                landmarks,
                Number(days)
            );


        if (
            !groupedLandmarks ||
            groupedLandmarks.length === 0
        ) {

            return res.status(500).json({

                error:
                    'Could not geographically group landmarks'

            });

        }


        groupedLandmarks.forEach(
            (
                places,
                index
            ) => {

                console.log(
                    `\n[Geographic Plan] Day ${index + 1}`
                );


                places.forEach(
                    place => {

                        console.log(
                            `  ${place.name} - ${place.distanceFromCenter} km`
                        );

                    }
                );

            }
        );


        // ====================================================
        // GENERATE ITINERARY
        // ====================================================

        console.log(
            '\n[Itinerary Controller] Generating itinerary...'
        );


        const itinerary =
            await generateItinerary({

                /*
                 * AI gets:
                 * Nainital, India
                 */

                destination:
                    itineraryDestination,

                days:
                    Number(days),

                budget:
                    Number(budgetINR),

                travelType,

                landmarks:
                    groupedLandmarks,

                weather:
                    null,

                currency: {

                    code:
                        location.currencyCode,

                    symbol:
                        location.currencySymbol,

                    rate

                }

            });


        console.log(
            '[Itinerary Controller] Itinerary generated successfully'
        );


        // ====================================================
        // AUTHENTICATED USER
        // ====================================================

        let userId = null;


        const authHeader =
            req.header('Authorization');


        if (authHeader) {

            const token =
                authHeader.replace(
                    'Bearer ',
                    ''
                );


            try {

                const decoded =
                    jwt.verify(
                        token,
                        process.env.JWT_SECRET ||
                        'secret_key'
                    );


                userId =
                    decoded.id;


            } catch (jwtErr) {

                console.log(
                    '[Itinerary Controller] Token verification notice:',
                    jwtErr.message
                );

            }

        }


        // ====================================================
        // SAVE TRIP
        // ====================================================

        let savedTrip = null;


        if (userId) {

            try {

                const convertedBudget =
                    (
                        Number(budgetINR) *
                        Number(rate)
                    ).toFixed(2);


                const suggestionsList =
                    itinerary?.suggestions ||
                    [

                        `Explore top attractions in ${resolvedPlace}`,

                        `Daily budget allocation: ${location.currencySymbol}${(
                            convertedBudget /
                            Number(days)
                        ).toFixed(0)}`,

                        `Use local transit for easy travel`

                    ];


                console.log(
                    '[Itinerary Controller] Saving complete itinerary to database...'
                );


                console.log(
                    '[Itinerary Controller] PLACE TO SAVE:',
                    resolvedPlace
                );


                console.log(
                    '[Itinerary Controller] COUNTRY:',
                    location.countryName
                );


                console.log(
                    '[Itinerary Controller] AI DESTINATION:',
                    itineraryDestination
                );


                // ====================================================
                // SAVE TO DATABASE
                // ====================================================

                const insertRes =
                    await db.query(

                        `INSERT INTO trips (
                            user_id,
                            destination_country,
                            destinations,
                            days,
                            budget_inr,
                            travel_type,
                            converted_budget,
                            currency_code,
                            exchange_rate,
                            breakdown,
                            suggestions,
                            itinerary
                        )
                        VALUES (
                            $1,
                            $2,
                            $3,
                            $4,
                            $5,
                            $6,
                            $7,
                            $8,
                            $9,
                            $10,
                            $11,
                            $12
                        )
                        RETURNING *`,

                        [

                            // User
                            userId,


                            // IMPORTANT:
                            // SAVE PLACE, NOT COUNTRY
                            resolvedPlace,


                            // Save place in destinations
                            JSON.stringify([
                                resolvedPlace
                            ]),


                            // Days
                            Number(days),


                            // INR budget
                            Number(budgetINR),


                            // Travel type
                            travelType ||
                            'Solo',


                            // Converted budget
                            convertedBudget,


                            // Country currency
                            location.currencyCode,


                            // Exchange rate
                            Number(rate),


                            // Budget breakdown
                            JSON.stringify(
                                budgetResult
                            ),


                            // Suggestions
                            JSON.stringify(
                                suggestionsList
                            ),


                            // COMPLETE ITINERARY
                            JSON.stringify(
                                itinerary
                            )

                        ]

                    );


                if (
                    insertRes.rows &&
                    insertRes.rows.length > 0
                ) {

                    savedTrip =
                        insertRes.rows[0];


                    console.log(
                        '[Itinerary Controller] Trip successfully saved.'
                    );


                    console.log(
                        '[Itinerary Controller] Database Trip ID:',
                        savedTrip.id
                    );


                    console.log(
                        '[Itinerary Controller] Saved destination:',
                        savedTrip.destination_country
                    );

                }

            } catch (dbErr) {

                console.error(
                    '[Itinerary Controller] Failed to save trip:',
                    dbErr.message
                );


                console.error(
                    dbErr.stack
                );

            }

        } else {

            console.log(
                '[Itinerary Controller] No authenticated user. Trip will not be saved.'
            );

        }


        // ====================================================
        // FINAL RESPONSE
        // ====================================================

        /*
         * Use the saved database row as the source of truth.
         */

        const response = {

            // Real database trip ID
            id:
                savedTrip?.id ||
                null,


            // IMPORTANT:
            // Return PLACE, not country
            destination:
                savedTrip?.destination_country ||
                resolvedPlace,


            // Country separately
            country:
                location.countryName,


            countryCode:
                location.countryCode,


            // Currency
            currencyCode:
                savedTrip?.currency_code ||
                location.currencyCode,


            currencySymbol:
                location.currencySymbol,


            // Exchange rate
            rate:
                Number(
                    savedTrip?.exchange_rate ||
                    rate
                ),


            // Days
            days:
                Number(
                    savedTrip?.days ||
                    days
                ),


            // INR budget
            budgetINR:
                Number(
                    savedTrip?.budget_inr ||
                    budgetINR
                ),


            // Travel type
            travelType:
                savedTrip?.travel_type ||
                travelType,


            // Budget breakdown
            breakdown:
                savedTrip?.breakdown ||
                budgetResult,


            // Complete generated itinerary
            itinerary:
                savedTrip?.itinerary ||
                itinerary,


            // Real landmarks
            landmarks,


            // Geographically grouped landmarks
            groupedLandmarks

        };


        console.log(
            '[Itinerary Controller] Sending response to browser...'
        );


        console.log(
            '[Itinerary Controller] Saved Trip ID:',
            response.id
        );


        console.log(
            '[Itinerary Controller] Final destination:',
            response.destination
        );


        console.log(
            '[Itinerary Controller] Itinerary included:',
            !!response.itinerary
        );


        return res
            .status(200)
            .json(response);


    } catch (error) {

        console.error(
            '\n===================================='
        );


        console.error(
            '[Itinerary Controller] ERROR:',
            error.message
        );


        console.error(
            error.stack
        );


        console.error(
            '===================================='
        );


        return res.status(500).json({

            error:
                error.message ||
                'Failed to generate itinerary'

        });

    }

};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    calculateItinerary
};