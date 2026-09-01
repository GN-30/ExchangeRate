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


const supabase =
    require('../supabase');


const jwt =
    require('jsonwebtoken');


// ============================================================
// CALCULATE ITINERARY
// ============================================================

const calculateItinerary =
    async (
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


            // ==================================================
            // VALIDATE DESTINATION
            // ==================================================

            if (
                !destination
            ) {

                return res.status(400).json({

                    error:
                        'Destination is required'

                });

            }


            const searchedPlace =
                String(
                    destination
                ).trim();


            // ==================================================
            // DEFAULT BUDGET
            // ==================================================

            if (
                !budgetINR ||
                Number(
                    budgetINR
                ) <= 0
            ) {

                const budgetMap = {

                    Budget:
                        5000,

                    Medium:
                        10000,

                    High:
                        20000,

                    Luxury:
                        50000

                };


                const perDay =
                    budgetMap[
                    budget
                    ] ||
                    10000;


                budgetINR =
                    Number(
                        days ||
                        3
                    ) *
                    perDay;


                console.log(
                    `[Itinerary Controller] Calculated default budgetINR: ₹${budgetINR}`
                );

            }


            // ==================================================
            // VALIDATE DAYS
            // ==================================================

            if (
                !days ||
                Number(
                    days
                ) <= 0
            ) {

                return res.status(400).json({

                    error:
                        'Invalid number of days'

                });

            }


            if (
                !budgetINR ||
                Number(
                    budgetINR
                ) <= 0
            ) {

                return res.status(400).json({

                    error:
                        'Invalid budget amount'

                });

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
                '[Itinerary Controller] Budget INR:',
                budgetINR
            );


            console.log(
                '[Itinerary Controller] Travel type:',
                travelType
            );


            // ==================================================
            // RESOLVE LOCATION
            // ==================================================

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


            // ==================================================
            // EXCHANGE RATE
            // ==================================================

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


            // ==================================================
            // BUDGET
            // ==================================================

            console.log(
                '[Itinerary Controller] Starting budget estimation...'
            );


            const budgetResult =
                await estimateBudget({

                    destination:
                        itineraryDestination,

                    days:
                        Number(
                            days
                        ),

                    budget:
                        Number(
                            budgetINR
                        ),

                    travelType,

                    currency:
                        location.currencyCode

                });


            console.log(
                '[Itinerary Controller] Budget result:',
                budgetResult
            );


            // ==================================================
            // REAL LANDMARKS
            // ==================================================

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


            // ==================================================
            // POPULAR LANDMARKS
            // ==================================================

            const popularLandmarks =
                landmarks
                    .slice()
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            (
                                Number(
                                    b.popularityScore
                                ) ||
                                0
                            ) -
                            (
                                Number(
                                    a.popularityScore
                                ) ||
                                0
                            )
                    )
                    .slice(
                        0,
                        Math.min(
                            12,
                            landmarks.length
                        )
                    );


            console.log(
                '\n[Itinerary Controller] Popular landmarks:'
            );


            popularLandmarks.forEach(
                (
                    place,
                    index
                ) => {

                    console.log(
                        `  ${index + 1}. ${place.name} | popularity=${place.popularityScore}`
                    );

                }
            );


            // ==================================================
            // GEOGRAPHICAL GROUPING
            // ==================================================

            console.log(
                '\n[Itinerary Controller] Grouping landmarks geographically...'
            );


            const groupedLandmarks =
                groupLandmarksByDistance(
                    landmarks,
                    Number(
                        days
                    )
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


            // ==================================================
            // GENERATE ITINERARY
            // ==================================================

            console.log(
                '\n[Itinerary Controller] Generating itinerary...'
            );


            const itinerary =
                await generateItinerary({

                    destination:
                        itineraryDestination,

                    days:
                        Number(
                            days
                        ),

                    budget:
                        Number(
                            budgetINR
                        ),

                    travelType,

                    landmarks:
                        groupedLandmarks,

                    popularPlaces:
                        popularLandmarks,

                    allVerifiedPlaces:
                        landmarks,

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


            // ==================================================
            // AUTHENTICATED USER
            // ==================================================

            let userId =
                null;


            const authHeader =
                req.header(
                    'Authorization'
                );


            if (
                authHeader
            ) {

                const token =
                    authHeader.replace(
                        'Bearer ',
                        ''
                    );


                try {

                    if (
                        !process.env.JWT_SECRET
                    ) {

                        console.warn(
                            '[Itinerary Controller] JWT_SECRET is not configured'
                        );

                    } else {

                        const decoded =
                            jwt.verify(
                                token,
                                process.env.JWT_SECRET
                            );


                        userId =
                            decoded.id;

                    }

                } catch (
                jwtErr
                ) {

                    console.log(
                        '[Itinerary Controller] Token verification notice:',
                        jwtErr.message
                    );

                }

            }


            // ==================================================
            // SAVE TRIP
            // ==================================================

            let savedTrip =
                null;


            if (
                userId
            ) {

                try {

                    const convertedBudget =
                        (
                            Number(
                                budgetINR
                            ) *
                            Number(
                                rate
                            )
                        ).toFixed(2);


                    const suggestionsList =
                        itinerary?.suggestions ||
                        [

                            `Explore top attractions in ${resolvedPlace}`,

                            `Daily budget allocation: ${location.currencySymbol}${(
                                convertedBudget /
                                Number(
                                    days
                                )
                            ).toFixed(0)}`,

                            `Use local transit for easy travel`

                        ];


                    const {

                        data:
                        insertedTrip,

                        error:
                        insertError

                    } =
                        await supabase
                            .from(
                                'trips'
                            )
                            .insert({

                                user_id:
                                    Number(
                                        userId
                                    ),

                                destination:
                                    resolvedPlace,

                                country:
                                    location.countryName,

                                destinations:
                                    [
                                        resolvedPlace
                                    ],

                                days:
                                    Number(
                                        days
                                    ),

                                budget_inr:
                                    Number(
                                        budgetINR
                                    ),

                                travel_type:
                                    travelType ||
                                    'Solo',

                                converted_budget:
                                    Number(
                                        convertedBudget
                                    ),

                                currency_code:
                                    location.currencyCode,

                                exchange_rate:
                                    Number(
                                        rate
                                    ),

                                breakdown:
                                    budgetResult,

                                suggestions:
                                    suggestionsList,

                                itinerary:
                                    itinerary

                            })
                            .select('*')
                            .single();


                    if (
                        insertError
                    ) {

                        throw new Error(
                            insertError.message ||
                            'Failed to save trip'
                        );

                    }


                    if (
                        insertedTrip
                    ) {

                        savedTrip =
                            insertedTrip;


                        console.log(
                            '[Itinerary Controller] Trip successfully saved.'
                        );

                    }


                } catch (
                dbErr
                ) {

                    console.error(
                        '[Itinerary Controller] Failed to save trip:',
                        dbErr
                    );


                    return res.status(500).json({

                        error:
                            'Trip was generated but could not be saved.',

                        details:
                            dbErr.message

                    });

                }

            }


            // ==================================================
            // FINAL RESPONSE
            // ==================================================

            const response = {

                id:
                    savedTrip?.id ||
                    null,

                destination:
                    savedTrip?.destination ||
                    resolvedPlace,

                country:
                    location.countryName,

                countryCode:
                    location.countryCode,

                currencyCode:
                    savedTrip?.currency_code ||
                    location.currencyCode,

                currencySymbol:
                    location.currencySymbol,

                rate:
                    Number(
                        savedTrip?.exchange_rate ||
                        rate
                    ),

                days:
                    Number(
                        savedTrip?.days ||
                        days
                    ),

                budgetINR:
                    Number(
                        savedTrip?.budget_inr ||
                        budgetINR
                    ),

                travelType:
                    savedTrip?.travel_type ||
                    travelType,

                breakdown:
                    savedTrip?.breakdown ||
                    budgetResult,

                itinerary:
                    savedTrip?.itinerary ||
                    itinerary,

                landmarks,

                popularLandmarks,

                groupedLandmarks

            };


            console.log(
                '[Itinerary Controller] Sending response to browser...'
            );


            return res
                .status(200)
                .json(
                    response
                );


        } catch (
        error
        ) {

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