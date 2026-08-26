const { resolveDestination } = require('./geocodingService');
const { searchPlaces } = require('./placesService');
const { getRoute } = require('./routesService');
const { getWeatherForecast } = require('./weatherService');
const { generateItineraryWithGemini } = require('./geminiService');
const { validateItinerary } = require('../utils/itineraryValidator');
const { calculateHaversineDistance, estimateTravelTimeMinutes } = require('../utils/distanceCalculator');

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
    // 1. Resolve destination coordinates
    const geo = await resolveDestination(destination);
    if (!geo) {
        throw new Error(`Could not resolve location for destination: ${destination}`);
    }

    // 2. Search places matching interests
    const rawPlaces = await searchPlaces(geo.name, geo.latitude, geo.longitude, interests, budget);
    if (!rawPlaces || rawPlaces.length === 0) {
        throw new Error(`Unable to retrieve verified places for ${destination} at this time.`);
    }

    // 3. Filter and limit candidates (take top 15 places to avoid token limit and keep relevance high)
    const filteredPlaces = rawPlaces.slice(0, 15);

    // 4. Fetch weather forecast
    const weather = await getWeatherForecast(geo.latitude, geo.longitude, startDate, days);

    // 5. Generate straight-line distances matrix for the AI planner
    const distanceMatrix = {};
    for (let i = 0; i < filteredPlaces.length; i++) {
        const p1 = filteredPlaces[i];
        distanceMatrix[p1.placeId] = {};
        for (let j = 0; j < filteredPlaces.length; j++) {
            const p2 = filteredPlaces[j];
            if (p1.placeId === p2.placeId) {
                distanceMatrix[p1.placeId][p2.placeId] = 0;
            } else {
                const dist = calculateHaversineDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
                distanceMatrix[p1.placeId][p2.placeId] = dist;
            }
        }
    }

    // 6. Build context and call Gemini
    let aiItinerary = await generateItineraryWithGemini({
        destination: geo.name,
        days,
        travelType,
        budget,
        travelers,
        interests,
        pace,
        weatherForecast: weather,
        candidatePlaces: filteredPlaces
    });

    if (!aiItinerary) {
        throw new Error("AI planning engine failed to generate an itinerary.");
    }

    // 7. Validate Gemini Output
    const validation = validateItinerary(aiItinerary, filteredPlaces, days, startDate);
    if (!validation.valid) {
        console.error(`[Itinerary Service] Validation failed: ${validation.error}`);
        throw new Error(`Itinerary validation failed: ${validation.error}`);
    }

    // 8. Calculate precise travel routes & times between sequential activities
    for (const day of aiItinerary.days) {
        let prevActivity = null;
        for (let idx = 0; idx < day.activities.length; idx++) {
            const activity = day.activities[idx];
            
            if (idx === 0) {
                activity.travelFromPreviousMinutes = 0;
                activity.distanceFromPreviousKm = 0;
            } else if (prevActivity) {
                try {
                    const route = await getRoute(
                        prevActivity.latitude,
                        prevActivity.longitude,
                        activity.latitude,
                        activity.longitude
                    );
                    activity.travelFromPreviousMinutes = route.durationMinutes;
                    activity.distanceFromPreviousKm = route.distanceKm;
                } catch (routeErr) {
                    console.error('[Itinerary Service] Route fetch error, using fallback math:', routeErr.message);
                    const dist = calculateHaversineDistance(
                        prevActivity.latitude, prevActivity.longitude,
                        activity.latitude, activity.longitude
                    );
                    activity.distanceFromPreviousKm = dist;
                    activity.travelFromPreviousMinutes = estimateTravelTimeMinutes(dist);
                }
            }
            prevActivity = activity;
        }
    }

    return {
        success: true,
        destination: geo.name,
        country: geo.country,
        latitude: geo.latitude,
        longitude: geo.longitude,
        days: days,
        budgetINR: budget,
        travelers: travelers,
        travelType: travelType,
        interests: interests,
        pace: pace,
        weather: weather,
        summary: aiItinerary.summary,
        itinerary: aiItinerary.days
    };
};

module.exports = { generateItinerary };
