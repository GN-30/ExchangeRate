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

const calculateItinerary = async (
    req,
    res
) => {

    try {

        console.log(
            '\n===================================='
        );


        console.log(
            '[Itinerary Controller] New request'
        );


        console.log(
            'Request body:',
            req.body
        );


        let {
            destination,
            days,
            budgetINR,
            budget,
            travelType
        } = req.body;

        if (!budgetINR || Number(budgetINR) <= 0) {
            const budgetMap = { Budget: 5000, Medium: 10000, High: 20000, Luxury: 50000 };
            const perDay = budgetMap[budget] || 10000;
            budgetINR = Number(days || 3) * perDay;
            console.log(`[Itinerary Controller] Calculated default budgetINR: ₹${budgetINR} based on level '${budget}' and ${days} days`);
        }

        console.log(
            '[Itinerary Controller] Destination:',
            destination
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

        if (!destination) {

            return res.status(400).json({

                error:
                    'Destination is required'
            });
        }


        if (
            !days ||
            Number(days) <= 0
        ) {

            return res.status(400).json({

                error:
                    'Invalid number of days'
            });
        }


        if (
            !budgetINR ||
            Number(budgetINR) <= 0
        ) {

            return res.status(400).json({

                error:
                    'Invalid budget amount'
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
                destination
            );


        console.log(
            '[Itinerary Controller] Location resolved:',
            location
        );


        const resolvedDestination =
            location.resolvedName ||
            destination;


        const itineraryDestination =
            `${resolvedDestination}, ${location.countryName}`;


        console.log(
            '[Itinerary Controller] Resolved destination:',
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
        // BUDGET
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
                resolvedDestination
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
                    `No real landmarks found for ${resolvedDestination}`
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


        // ----------------------------------------------------
        // Print grouping
        // ----------------------------------------------------

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

                destination:
                    itineraryDestination,

                days:
                    Number(days),

                budget:
                    Number(budgetINR),

                travelType,

                // IMPORTANT:
                // Pass grouped landmarks
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
        // SAVE TRIP TO DATABASE FOR USER HISTORY/PROFILE
        // ====================================================

        let userId = null;
        const authHeader = req.header('Authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
                userId = decoded.id;
            } catch (jwtErr) {
                console.log('[Itinerary Controller] Token verification notice:', jwtErr.message);
            }
        }

        let savedTripId = null;
        if (userId) {
            try {
                const convertedBudget = (Number(budgetINR) * Number(rate)).toFixed(2);
                const suggestionsList = itinerary?.suggestions || [
                    `Explore top attractions in ${resolvedDestination}`,
                    `Daily budget allocation: ${location.currencySymbol}${(convertedBudget / Number(days)).toFixed(0)}`,
                    `Use local transit for easy travel`
                ];

                const insertRes = await db.query(
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
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    RETURNING id`,
                    [
                        userId,
                        location.countryName || resolvedDestination,
                        JSON.stringify([resolvedDestination]),
                        Number(days),
                        Number(budgetINR),
                        travelType || 'Solo',
                        convertedBudget,
                        location.currencyCode,
                        Number(rate),
                        JSON.stringify(budgetResult),
                        JSON.stringify(suggestionsList),
                        JSON.stringify(itinerary)
                    ]
                );

                if (insertRes.rows && insertRes.rows.length > 0) {
                    savedTripId = insertRes.rows[0].id;
                    console.log('[Itinerary Controller] Successfully saved trip to DB with ID:', savedTripId);
                }
            } catch (dbErr) {
                console.error('[Itinerary Controller] Failed to save trip to database:', dbErr.message);
            }
        }

        // ====================================================
        // FINAL RESPONSE
        // ====================================================

        const response = {

            id: savedTripId,

            destination:
                resolvedDestination,

            country:
                location.countryName,

            countryCode:
                location.countryCode,

            currencyCode:
                location.currencyCode,

            currencySymbol:
                location.currencySymbol,

            rate,

            days:
                Number(days),

            budgetINR:
                Number(budgetINR),

            travelType,

            breakdown:
                budgetResult,

            itinerary,

            landmarks,

            groupedLandmarks
        };


        console.log(
            '[Itinerary Controller] Sending response to browser...'
        );


        return res.status(200).json(
            response
        );


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


module.exports = {
    calculateItinerary
};