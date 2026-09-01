const {
    haversineDistance
} = require('../utils/distance');


// ============================================================
// CALCULATE CENTER
// ============================================================

const calculateCenter = (
    landmarks
) => {

    if (
        !Array.isArray(landmarks) ||
        !landmarks.length
    ) {

        return null;

    }


    const valid =
        landmarks.filter(
            place =>
                Number.isFinite(
                    Number(
                        place.lat ??
                        place.latitude
                    )
                ) &&
                Number.isFinite(
                    Number(
                        place.lon ??
                        place.longitude
                    )
                )
        );


    if (
        !valid.length
    ) {

        return null;

    }


    const lat =
        valid.reduce(
            (
                sum,
                place
            ) =>
                sum +
                Number(
                    place.lat ??
                    place.latitude
                ),
            0
        ) /
        valid.length;


    const lon =
        valid.reduce(
            (
                sum,
                place
            ) =>
                sum +
                Number(
                    place.lon ??
                    place.longitude
                ),
            0
        ) /
        valid.length;


    return {

        lat,

        lon

    };

};


// ============================================================
// ADD DISTANCE FROM CENTER
// ============================================================

const calculateLandmarkDistances = (
    landmarks,
    center
) => {

    return landmarks.map(
        place => {

            const lat =
                Number(
                    place.lat ??
                    place.latitude
                );


            const lon =
                Number(
                    place.lon ??
                    place.longitude
                );


            const distance =
                haversineDistance(
                    center.lat,
                    center.lon,
                    lat,
                    lon
                );


            return {

                ...place,

                distanceFromCenter:
                    Number(
                        distance.toFixed(2)
                    )

            };

        }
    );

};


// ============================================================
// NORMALIZE NAME
// ============================================================

const normalizeName = (
    name
) => {

    return String(
        name || ''
    )
        .trim()
        .toLowerCase()
        .replace(
            /\s+/g,
            ' '
        );

};


// ============================================================
// POPULARITY SCORE
// ============================================================

const getPopularityScore = (
    place
) => {

    const popularity =
        Number(
            place.popularityScore
        );


    if (
        Number.isFinite(
            popularity
        )
    ) {

        return popularity;

    }


    const importance =
        Number(
            place.importance
        ) || 0;


    return importance * 100;

};


// ============================================================
// GROUP LANDMARKS
// ============================================================

const groupLandmarksByDistance = (
    landmarks,
    days
) => {

    if (
        !Array.isArray(landmarks) ||
        !landmarks.length
    ) {

        return [];

    }


    const center =
        calculateCenter(
            landmarks
        );


    if (
        !center
    ) {

        return [];

    }


    const places =
        calculateLandmarkDistances(
            landmarks,
            center
        );


    const numberOfDays =
        Math.max(
            1,
            Number(days) || 1
        );


    // ========================================================
    // SORT BY POPULARITY
    // ========================================================

    places.sort(
        (
            a,
            b
        ) => {

            const popularityDifference =
                getPopularityScore(b) -
                getPopularityScore(a);


            /*
             * Popularity is the main factor.
             *
             * Distance is only used as a tie breaker.
             */

            if (
                Math.abs(
                    popularityDifference
                ) > 10
            ) {

                return popularityDifference;

            }


            return (
                a.distanceFromCenter -
                b.distanceFromCenter
            );

        }
    );


    // ========================================================
    // CREATE DAY GROUPS
    // ========================================================

    const groups =
        Array.from(
            {
                length:
                    numberOfDays
            },
            () => []
        );


    // ========================================================
    // DETERMINE NUMBER OF PLACES
    // ========================================================

    const totalPlaces =
        places.length;


    /*
     * We don't want one day to receive
     * all the famous places and another
     * day to receive nothing.
     */

    const basePlacesPerDay =
        Math.floor(
            totalPlaces /
            numberOfDays
        );


    let remainder =
        totalPlaces %
        numberOfDays;


    // ========================================================
    // FIRST PASS
    // ========================================================

    let index = 0;


    for (
        let day = 0;
        day < numberOfDays;
        day++
    ) {

        let count =
            basePlacesPerDay;


        if (
            remainder > 0
        ) {

            count++;

            remainder--;

        }


        /*
         * If there are fewer places than days,
         * some days remain empty.
         */

        for (
            let i = 0;
            i < count;
            i++
        ) {

            if (
                index >= totalPlaces
            ) {

                break;

            }


            groups[day].push(
                places[index]
            );


            index++;

        }

    }


    // ========================================================
    // IMPROVE GEOGRAPHICAL ORDER
    // ========================================================

    groups.forEach(
        group => {

            if (
                group.length <= 1
            ) {

                return;

            }


            /*
             * Keep the most popular attraction
             * first, then order remaining places
             * geographically around it.
             */

            group.sort(
                (
                    a,
                    b
                ) => {

                    const popularityDifference =
                        getPopularityScore(b) -
                        getPopularityScore(a);


                    if (
                        Math.abs(
                            popularityDifference
                        ) > 10
                    ) {

                        return popularityDifference;

                    }


                    return (
                        a.distanceFromCenter -
                        b.distanceFromCenter
                    );

                }
            );

        }
    );


    // ========================================================
    // LOGGING
    // ========================================================

    groups.forEach(
        (
            group,
            dayIndex
        ) => {

            console.log(
                `\n[Geographic Plan] Day ${dayIndex + 1}`
            );


            group.forEach(
                place => {

                    console.log(
                        `  ${place.name} | ${place.distanceFromCenter} km | popularity ${getPopularityScore(place)}`
                    );

                }
            );

        }
    );


    return groups;

};


module.exports = {

    groupLandmarksByDistance

};