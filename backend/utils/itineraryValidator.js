const validateItinerary = (itinerary, candidates, requestedDays, startDate) => {
    if (!itinerary) {
        return { valid: false, error: "Itinerary is null or undefined." };
    }

    if (!Array.isArray(itinerary.days)) {
        return { valid: false, error: "Itinerary structure is invalid. 'days' must be an array." };
    }

    if (itinerary.days.length !== requestedDays) {
        return { valid: false, error: `Day count mismatch. Expected ${requestedDays}, got ${itinerary.days.length}.` };
    }

    const candidateIds = new Set(candidates.map(c => c.placeId));

    for (const day of itinerary.days) {
        if (!day.activities || !Array.isArray(day.activities)) {
            return { valid: false, error: `Day ${day.day || 'unknown'} has no activities array.` };
        }

        if (startDate) {
            try {
                const expectedDate = new Date(startDate);
                expectedDate.setDate(expectedDate.getDate() + (day.day - 1));
                
                const yyyy = expectedDate.getFullYear();
                const mm = String(expectedDate.getMonth() + 1).padStart(2, '0');
                const dd = String(expectedDate.getDate()).padStart(2, '0');
                const expectedDateStr = `${yyyy}-${mm}-${dd}`;
                
                if (day.date !== expectedDateStr) {
                    console.log(`[Validator] Day ${day.day} date corrected from ${day.date} to ${expectedDateStr}`);
                    day.date = expectedDateStr; 
                }
            } catch (e) {
                console.error('[Validator] Date correction failed:', e.message);
            }
        }

        for (const activity of day.activities) {
            if (!activity.placeId) {
                return { valid: false, error: `Activity '${activity.name}' is missing a placeId.` };
            }

            if (!candidateIds.has(activity.placeId)) {
                return { 
                    valid: false, 
                    error: `Hallucination detected! Place ID '${activity.placeId}' ('${activity.name}') was not in the candidate places dataset.` 
                };
            }

            const matchedCandidate = candidates.find(c => c.placeId === activity.placeId);
            if (matchedCandidate) {
                activity.latitude = matchedCandidate.latitude;
                activity.longitude = matchedCandidate.longitude;
                activity.rating = matchedCandidate.rating;
                activity.address = matchedCandidate.address;
                activity.category = matchedCandidate.category;
            }
        }
    }

    return { valid: true };
};

module.exports = { validateItinerary };
