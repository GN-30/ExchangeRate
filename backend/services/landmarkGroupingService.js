const {
    haversineDistance
} = require('../utils/distance');


// ============================================================
// CALCULATE CENTER OF LANDMARKS
// ============================================================

const calculateCenter = (landmarks) => {

    if (!landmarks.length) {
        return null;
    }

    const valid = landmarks.filter(
        place =>
            place.lat !== undefined &&
            place.lon !== undefined
    );

    if (!valid.length) {
        return null;
    }

    const lat =
        valid.reduce(
            (sum, place) =>
                sum + Number(place.lat),
            0
        ) / valid.length;

    const lon =
        valid.reduce(
            (sum, place) =>
                sum + Number(place.lon),
            0
        ) / valid.length;

    return {
        lat,
        lon
    };
};


// ============================================================
// ADD DISTANCE FROM DESTINATION CENTER
// ============================================================

const calculateLandmarkDistances = (
    landmarks,
    center
) => {

    return landmarks.map(place => {

        const distance =
            haversineDistance(
                center.lat,
                center.lon,
                Number(place.lat),
                Number(place.lon)
            );

        return {
            ...place,
            distanceFromCenter:
                Number(
                    distance.toFixed(2)
                )
        };
    });
};


// ============================================================
// GROUP LANDMARKS PROGRESSIVELY
// ============================================================

const groupLandmarksByDistance = (
    landmarks,
    days
) => {

    if (!landmarks.length) {
        return [];
    }

    const center =
        calculateCenter(
            landmarks
        );

    if (!center) {
        return [];
    }

    const places =
        calculateLandmarkDistances(
            landmarks,
            center
        );


    // --------------------------------------------------------
    // Sort nearest → farthest
    // --------------------------------------------------------

    places.sort(
        (a, b) =>
            a.distanceFromCenter -
            b.distanceFromCenter
    );


    const totalPlaces =
        places.length;


    const numberOfDays =
        Math.max(
            1,
            Number(days)
        );


    // --------------------------------------------------------
    // Determine how many places per day
    // --------------------------------------------------------

    const groups =
        Array.from(
            {
                length:
                    numberOfDays
            },
            () => []
        );


    /*
     * We intentionally put more nearby places
     * into the first days.
     *
     * Example:
     *
     * 15 places / 7 days
     *
     * Day 1 → nearest
     * Day 2 → nearest
     * Day 3 → slightly farther
     * Day 4 → farther
     * ...
     */


    const weights = [];

    for (
        let i = 0;
        i < numberOfDays;
        i++
    ) {

        // First days receive smaller
        // distance ranges.

        const weight =
            1 + i * 0.35;

        weights.push(weight);
    }


    const weightTotal =
        weights.reduce(
            (sum, value) =>
                sum + value,
            0
        );


    let assigned = 0;


    for (
        let day = 0;
        day < numberOfDays;
        day++
    ) {

        let count =
            Math.round(
                (
                    weights[day] /
                    weightTotal
                ) *
                totalPlaces
            );


        // Minimum one place when possible

        if (
            count < 1 &&
            assigned < totalPlaces
        ) {
            count = 1;
        }


        // Don't exceed available places

        count =
            Math.min(
                count,
                totalPlaces - assigned
            );


        groups[day] =
            places.slice(
                assigned,
                assigned + count
            );


        assigned += count;


        if (
            assigned >= totalPlaces
        ) {
            break;
        }
    }


    // --------------------------------------------------------
    // If anything remains, distribute it
    // --------------------------------------------------------

    let remaining =
        places.slice(assigned);


    let index = 0;

    while (
        remaining.length > 0
    ) {

        groups[index %
            numberOfDays].push(
                remaining.shift()
            );

        index++;
    }


    return groups;
};


module.exports = {
    groupLandmarksByDistance
};