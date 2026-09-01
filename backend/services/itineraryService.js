const {
    resolveDestination
} = require('./geocodingService');

const {
    searchPlaces
} = require('./placesService');

const {
    getRoute
} = require('./routesService');

const {
    getWeatherForecast
} = require('./weatherService');

const {
    generateItineraryWithGemini
} = require('./geminiService');

const {
    validateItinerary
} = require('../utils/itineraryValidator');

const {
    calculateHaversineDistance,
    estimateTravelTimeMinutes
} = require('../utils/distanceCalculator');


// ======================================================
// GENERATE ITINERARY
// ======================================================

const generateItinerary = async ({
    destination,
    days,
    startDate,
    budget,
    travelers,
    travelType,
    interests,
    pace
}) => {

    // ==================================================
    // 1. RESOLVE DESTINATION
    // ==================================================

    const geo =
        await resolveDestination(
            destination
        );


    if (!geo) {

        throw new Error(
            `Could not resolve location for destination: ${destination}`
        );

    }


    console.log(
        `[Itinerary Service] Destination resolved: ${geo.name}, ${geo.country}`
    );


    console.log(
        `[Itinerary Service] Coordinates: ${geo.latitude}, ${geo.longitude}`
    );


    // ==================================================
    // 2. SEARCH PLACES
    // ==================================================

    const placesResult =
        await searchPlaces(
            geo.name,
            geo.latitude,
            geo.longitude,
            interests,
            budget
        );


    if (
        !placesResult ||
        !placesResult.allPlaces ||
        placesResult.allPlaces.length === 0
    ) {

        throw new Error(
            `Unable to retrieve verified places for ${destination} at this time.`
        );

    }


    // ==================================================
    // 3. PRIMARY DESTINATION PLACES
    // ==================================================

    const primaryPlaces =
        Array.isArray(
            placesResult.primaryPlaces
        )
            ? placesResult.primaryPlaces
            : [];


    // ==================================================
    // 4. NEARBY PLACES
    // ==================================================

    const nearbyPlaces =
        Array.isArray(
            placesResult.nearbyPlaces
        )
            ? placesResult.nearbyPlaces
            : [];


    console.log(
        `[Itinerary Service] Primary places: ${primaryPlaces.length}`
    );


    console.log(
        `[Itinerary Service] Nearby places: ${nearbyPlaces.length}`
    );


    // ==================================================
    // 5. LIMIT PLACES SENT TO AI
    // ==================================================

    const filteredPrimaryPlaces =
        primaryPlaces.slice(
            0,
            20
        );


    const filteredNearbyPlaces =
        nearbyPlaces.slice(
            0,
            15
        );


    /*
        Primary places are intentionally placed FIRST.

        This makes the main destination attractions
        more important than distant side trips.
    */

    const filteredPlaces = [

        ...filteredPrimaryPlaces,

        ...filteredNearbyPlaces

    ];


    if (
        filteredPlaces.length === 0
    ) {

        throw new Error(
            `No suitable verified places found for ${destination}.`
        );

    }


    // ==================================================
    // 6. WEATHER
    // ==================================================

    const weather =
        await getWeatherForecast(
            geo.latitude,
            geo.longitude,
            startDate,
            days
        );


    console.log(
        `[Itinerary Service] Weather generated for ${days} day(s).`
    );


    // ==================================================
    // 7. DISTANCE MATRIX
    // ==================================================

    const distanceMatrix = {};


    for (
        let i = 0;
        i < filteredPlaces.length;
        i++
    ) {

        const p1 =
            filteredPlaces[i];


        distanceMatrix[
            p1.placeId
        ] = {};


        for (
            let j = 0;
            j < filteredPlaces.length;
            j++
        ) {

            const p2 =
                filteredPlaces[j];


            if (
                p1.placeId ===
                p2.placeId
            ) {

                distanceMatrix[
                    p1.placeId
                ][
                    p2.placeId
                ] = 0;

            } else {

                const distance =
                    calculateHaversineDistance(
                        p1.latitude,
                        p1.longitude,
                        p2.latitude,
                        p2.longitude
                    );


                distanceMatrix[
                    p1.placeId
                ][
                    p2.placeId
                ] =
                    Number(
                        distance.toFixed(2)
                    );

            }

        }

    }


    // ==================================================
    // 8. GENERATE AI ITINERARY
    // ==================================================

    console.log(
        `[Itinerary Service] Sending places to Gemini...`
    );


    const aiItinerary =
        await generateItineraryWithGemini({

            destination:
                geo.name,

            days:
                days,

            startDate:
                startDate,

            travelType:
                travelType,

            budget:
                budget,

            travelers:
                travelers,

            interests:
                interests,

            pace:
                pace,

            weatherForecast:
                weather,

            primaryPlaces:
                filteredPrimaryPlaces,

            nearbyPlaces:
                filteredNearbyPlaces,

            candidatePlaces:
                filteredPlaces,

            distanceMatrix:
                distanceMatrix

        });


    if (
        !aiItinerary
    ) {

        throw new Error(
            'AI planning engine failed to generate an itinerary.'
        );

    }


    // ==================================================
    // 9. VALIDATE AI OUTPUT
    // ==================================================

    const validation =
        validateItinerary(
            aiItinerary,
            filteredPlaces,
            days,
            startDate
        );


    if (
        !validation.valid
    ) {

        console.error(
            `[Itinerary Service] Validation failed: ${validation.error}`
        );


        throw new Error(
            `Itinerary validation failed: ${validation.error}`
        );

    }


    // ==================================================
    // 10. ADD ROUTE INFORMATION
    // ==================================================

    for (
        const day of
        aiItinerary.days
    ) {

        let previousActivity =
            null;


        for (
            let index = 0;
            index < day.activities.length;
            index++
        ) {

            const activity =
                day.activities[index];


            // ==========================================
            // FIRST ACTIVITY
            // ==========================================

            if (
                index === 0
            ) {

                activity.travelFromPreviousMinutes =
                    0;

                activity.distanceFromPreviousKm =
                    0;

            }


            // ==========================================
            // FOLLOWING ACTIVITIES
            // ==========================================

            else if (
                previousActivity
            ) {

                try {

                    const route =
                        await getRoute(

                            previousActivity.latitude,
                            previousActivity.longitude,

                            activity.latitude,
                            activity.longitude

                        );


                    activity.travelFromPreviousMinutes =
                        route.durationMinutes;


                    activity.distanceFromPreviousKm =
                        route.distanceKm;


                } catch (
                routeError
                ) {

                    console.error(
                        '[Itinerary Service] Route error:',
                        routeError.message
                    );


                    const distance =
                        calculateHaversineDistance(

                            previousActivity.latitude,
                            previousActivity.longitude,

                            activity.latitude,
                            activity.longitude

                        );


                    activity.distanceFromPreviousKm =
                        distance;


                    activity.travelFromPreviousMinutes =
                        estimateTravelTimeMinutes(
                            distance
                        );

                }

            }


            previousActivity =
                activity;

        }

    }


    // ==================================================
    // 11. FIND USED PLACE IDS
    // ==================================================

    const usedPlaceIds =
        new Set();


    for (
        const day of
        aiItinerary.days
    ) {

        for (
            const activity of
            day.activities
        ) {

            if (
                activity.placeId
            ) {

                usedPlaceIds.add(
                    activity.placeId
                );

            }

        }

    }


    // ==================================================
    // 12. MORE PRIMARY PLACES
    // ==================================================

    const morePrimaryPlaces =
        filteredPrimaryPlaces.filter(
            place =>
                !usedPlaceIds.has(
                    place.placeId
                )
        );


    // ==================================================
    // 13. MORE NEARBY PLACES
    // ==================================================

    const moreNearbyPlaces =
        filteredNearbyPlaces.filter(
            place =>
                !usedPlaceIds.has(
                    place.placeId
                )
        );


    // ==================================================
    // 14. FINAL RESPONSE
    // ==================================================

    return {

        success:
            true,

        destination:
            geo.name,

        country:
            geo.country,

        latitude:
            geo.latitude,

        longitude:
            geo.longitude,

        days:
            days,

        budgetINR:
            budget,

        travelers:
            travelers,

        travelType:
            travelType,

        interests:
            interests,

        pace:
            pace,

        weather:
            weather,

        summary:
            aiItinerary.summary,

        // ==============================================
        // DAY-BY-DAY ITINERARY
        // ==============================================

        itinerary:
            aiItinerary.days,

        // ==============================================
        // UNUSED PRIMARY PLACES
        // ==============================================

        morePrimaryPlaces:
            morePrimaryPlaces,

        // ==============================================
        // UNUSED NEARBY PLACES
        // ==============================================

        nearbyPlaces:
            moreNearbyPlaces,

        // ==============================================
        // ALL PLACES
        // ==============================================

        allPlaces:
            filteredPlaces

    };

};


// ======================================================
// EXPORT
// ======================================================

module.exports = {

    generateItinerary

};