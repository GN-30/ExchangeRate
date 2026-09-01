const axios = require('axios');

const cache = new Map();


// ======================================================
// GET WEATHER FORECAST
// ======================================================

const getWeatherForecast = async (
    latitude,
    longitude,
    startDate,
    days
) => {

    const safeDays =
        Math.max(
            1,
            parseInt(days) || 1
        );


    const key =
        `${latitude.toFixed(2)},${longitude.toFixed(2)},${startDate},${safeDays}`;


    if (
        cache.has(key)
    ) {

        console.log(
            '[Weather] Cache hit.'
        );

        return cache.get(key);

    }


    const apiKey =
        (
            process.env.WEATHER_API_KEY ||
            ''
        ).trim();


    let forecastData =
        null;


    // ==================================================
    // OPENWEATHER
    // ==================================================

    if (
        apiKey &&
        apiKey !== 'your_api_key_here'
    ) {

        try {

            console.log(
                `[Weather] Using OpenWeatherMap API for coordinates: ${latitude}, ${longitude}`
            );


            const response =
                await axios.get(
                    'https://api.openweathermap.org/data/2.5/forecast',
                    {

                        params: {

                            lat:
                                latitude,

                            lon:
                                longitude,

                            appid:
                                apiKey,

                            units:
                                'metric'

                        },

                        timeout:
                            10000

                    }
                );


            if (
                response.data &&
                response.data.list
            ) {

                const dailyWeather =
                    {};


                response.data.list.forEach(
                    item => {

                        const date =
                            item.dt_txt
                                .split(' ')[0];


                        if (
                            !dailyWeather[date]
                        ) {

                            dailyWeather[date] = {

                                temps: [],

                                minTemps: [],

                                maxTemps: [],

                                conditions: [],

                                rainProbability: []

                            };

                        }


                        dailyWeather[date]
                            .temps
                            .push(
                                item.main.temp
                            );


                        dailyWeather[date]
                            .minTemps
                            .push(
                                item.main.temp_min
                            );


                        dailyWeather[date]
                            .maxTemps
                            .push(
                                item.main.temp_max
                            );


                        dailyWeather[date]
                            .conditions
                            .push(
                                item.weather?.[0]?.main ||
                                'Clear'
                            );


                        dailyWeather[date]
                            .rainProbability
                            .push(
                                Number(
                                    item.pop || 0
                                )
                            );

                    }
                );


                forecastData =
                    Object.keys(
                        dailyWeather
                    )
                        .map(
                            (date, idx) => {

                                const weather =
                                    dailyWeather[
                                    date
                                    ];


                                const average =
                                    valuesAverage(
                                        weather.temps
                                    );


                                const min =
                                    Math.min(
                                        ...weather.minTemps
                                    );


                                const max =
                                    Math.max(
                                        ...weather.maxTemps
                                    );


                                const condition =
                                    mostCommon(
                                        weather.conditions
                                    );


                                const rainProbability =
                                    Math.round(
                                        valuesAverage(
                                            weather.rainProbability
                                        ) *
                                        100
                                    );


                                return {

                                    day:
                                        idx + 1,

                                    date,

                                    tempCelsius:
                                        Math.round(
                                            average
                                        ),

                                    minTempCelsius:
                                        Math.round(
                                            min
                                        ),

                                    maxTempCelsius:
                                        Math.round(
                                            max
                                        ),

                                    condition,

                                    rainProbability,

                                    description:
                                        `${condition}. Average temperature ${Math.round(
                                            average
                                        )}°C with approximately ${rainProbability}% chance of rain.`

                                };

                            }
                        )
                        .slice(
                            0,
                            safeDays
                        );

            }

        } catch (error) {

            console.error(
                '[Weather] OpenWeatherMap API Error:',
                error.message
            );

        }

    }


    // ==================================================
    // FALLBACK
    // ==================================================

    if (
        !forecastData ||
        forecastData.length === 0
    ) {

        console.log(
            '[Weather] Generating deterministic seasonal fallback.'
        );


        forecastData =
            generateSeasonalForecast(
                latitude,
                longitude,
                startDate,
                safeDays
            );

    }


    cache.set(
        key,
        forecastData
    );


    return forecastData;

};


// ======================================================
// AVERAGE
// ======================================================

const valuesAverage = (
    values
) => {

    if (
        !values ||
        values.length === 0
    ) {

        return 0;

    }


    return (
        values.reduce(
            (a, b) =>
                a + b,
            0
        ) /
        values.length
    );

};


// ======================================================
// MOST COMMON
// ======================================================

const mostCommon = (
    values
) => {

    const counts =
        {};


    for (
        const value of values
    ) {

        counts[value] =
            (
                counts[value] ||
                0
            ) + 1;

    }


    return Object.keys(
        counts
    )
        .sort(
            (a, b) =>
                counts[b] -
                counts[a]
        )[0] ||
        'Clear';

};


// ======================================================
// SEASONAL FALLBACK
// ======================================================

const generateSeasonalForecast = (
    latitude,
    longitude,
    startDate,
    days
) => {

    const date =
        new Date(
            startDate ||
            Date.now()
        );


    const month =
        date.getMonth();


    const isIndia =
        latitude > 8 &&
        latitude < 37 &&
        longitude > 68 &&
        longitude < 97;


    let baseTemp =
        25;

    let condition =
        'Clear';

    let description =
        'Generally pleasant conditions.';


    if (
        isIndia
    ) {

        if (
            month >= 5 &&
            month <= 8
        ) {

            baseTemp =
                28;

            condition =
                'Rain';

            description =
                'Monsoon conditions with possible rain and cloudy skies.';

        } else if (
            month >= 10 ||
            month <= 1
        ) {

            baseTemp =
                20;

            condition =
                'Clear';

            description =
                'Generally pleasant and cooler conditions.';

        } else {

            baseTemp =
                32;

            condition =
                'Clouds';

            description =
                'Warm conditions with partly cloudy skies.';

        }

    }


    const forecast =
        [];


    for (
        let i = 0;
        i < days;
        i++
    ) {

        const currentDate =
            new Date(date);


        currentDate.setDate(
            date.getDate() + i
        );


        const yyyy =
            currentDate
                .getFullYear();


        const mm =
            String(
                currentDate.getMonth() + 1
            )
                .padStart(
                    2,
                    '0'
                );


        const dd =
            String(
                currentDate.getDate()
            )
                .padStart(
                    2,
                    '0'
                );


        const dateStr =
            `${yyyy}-${mm}-${dd}`;


        forecast.push({

            day:
                i + 1,

            date:
                dateStr,

            tempCelsius:
                baseTemp,

            minTempCelsius:
                baseTemp - 3,

            maxTempCelsius:
                baseTemp + 3,

            condition,

            rainProbability:
                condition === 'Rain'
                    ? 60
                    : 10,

            description

        });

    }


    return forecast;

};


module.exports = {
    getWeatherForecast
};