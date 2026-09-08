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

    const safeDays = Math.max(
        1,
        parseInt(days) || 1
    );

    const key =
        `${Number(latitude).toFixed(2)},` +
        `${Number(longitude).toFixed(2)},` +
        `${startDate || 'today'},` +
        `${safeDays}`;

    // --------------------------------------------------
    // CACHE
    // --------------------------------------------------

    if (cache.has(key)) {

        console.log('[Weather] Cache hit.');

        return cache.get(key);
    }


    const apiKey = (
        process.env.WEATHER_API_KEY || ''
    ).trim();


    let forecastData = null;


    // ==================================================
    // OPENWEATHER API
    // ==================================================

    if (
        apiKey &&
        apiKey !== 'your_api_key_here'
    ) {

        try {

            console.log(
                `[Weather] Fetching forecast for ${latitude}, ${longitude}`
            );


            const response = await axios.get(
                'https://api.openweathermap.org/data/2.5/forecast',
                {
                    params: {
                        lat: latitude,
                        lon: longitude,
                        appid: apiKey,
                        units: 'metric'
                    },

                    timeout: 10000
                }
            );


            if (
                response.data &&
                Array.isArray(response.data.list)
            ) {

                forecastData =
                    buildDailyForecast(
                        response.data.list,
                        startDate,
                        safeDays
                    );
            }


        } catch (error) {

            console.error(
                '[Weather] OpenWeather API Error:',
                error.response?.data?.message ||
                error.message
            );

            forecastData = null;
        }
    }


    // ==================================================
    // FALLBACK
    // ==================================================

    /*
     * OpenWeather's free 5-day/3-hour endpoint cannot
     * provide genuine forecast data beyond its available
     * forecast window.
     *
     * Instead of generating random weather, we return
     * deterministic seasonal estimates and clearly mark
     * them as estimates.
     */

    if (
        !forecastData ||
        forecastData.length === 0
    ) {

        console.log(
            '[Weather] Using seasonal estimate fallback.'
        );


        forecastData =
            generateSeasonalForecast(
                latitude,
                longitude,
                startDate,
                safeDays
            );
    }


    // ==================================================
    // CACHE RESULT
    // ==================================================

    cache.set(
        key,
        forecastData
    );


    return forecastData;
};


// ======================================================
// BUILD DAILY FORECAST
// ======================================================

const buildDailyForecast = (
    forecastList,
    startDate,
    days
) => {

    if (
        !Array.isArray(forecastList) ||
        forecastList.length === 0
    ) {

        return null;
    }


    const requestedDates =
        getRequestedDates(
            startDate,
            days
        );


    const dailyWeather = {};


    // --------------------------------------------------
    // GROUP 3-HOUR FORECASTS BY DATE
    // --------------------------------------------------

    forecastList.forEach(item => {

        if (
            !item ||
            !item.dt_txt
        ) {

            return;
        }


        const date =
            item.dt_txt.split(' ')[0];


        if (
            !dailyWeather[date]
        ) {

            dailyWeather[date] = {

                temperatures: [],

                feelsLike: [],

                minTemperatures: [],

                maxTemperatures: [],

                humidity: [],

                windSpeed: [],

                rainProbability: [],

                rainfall: [],

                conditions: [],

                descriptions: [],

                icons: []
            };
        }


        const weather =
            dailyWeather[date];


        // Temperature
        if (
            Number.isFinite(
                Number(item.main?.temp)
            )
        ) {

            weather.temperatures.push(
                Number(item.main.temp)
            );
        }


        // Feels like
        if (
            Number.isFinite(
                Number(item.main?.feels_like)
            )
        ) {

            weather.feelsLike.push(
                Number(item.main.feels_like)
            );
        }


        // Min temperature
        if (
            Number.isFinite(
                Number(item.main?.temp_min)
            )
        ) {

            weather.minTemperatures.push(
                Number(item.main.temp_min)
            );
        }


        // Max temperature
        if (
            Number.isFinite(
                Number(item.main?.temp_max)
            )
        ) {

            weather.maxTemperatures.push(
                Number(item.main.temp_max)
            );
        }


        // Humidity
        if (
            Number.isFinite(
                Number(item.main?.humidity)
            )
        ) {

            weather.humidity.push(
                Number(item.main.humidity)
            );
        }


        // Wind
        if (
            Number.isFinite(
                Number(item.wind?.speed)
            )
        ) {

            weather.windSpeed.push(
                Number(item.wind.speed)
            );
        }


        // Rain probability
        if (
            Number.isFinite(
                Number(item.pop)
            )
        ) {

            weather.rainProbability.push(
                Number(item.pop)
            );
        }


        // Rainfall
        let rainfall = 0;

        if (
            item.rain &&
            Number.isFinite(
                Number(item.rain['3h'])
            )
        ) {

            rainfall =
                Number(item.rain['3h']);
        }


        weather.rainfall.push(
            rainfall
        );


        // Weather condition
        const condition =
            item.weather?.[0]?.main ||
            'Clear';


        weather.conditions.push(
            condition
        );


        // Description
        const description =
            item.weather?.[0]?.description ||
            condition;


        weather.descriptions.push(
            description
        );


        // Icon
        const icon =
            item.weather?.[0]?.icon ||
            null;


        if (icon) {

            weather.icons.push(
                icon
            );
        }

    });


    // ==================================================
    // CREATE DAILY RESULTS
    // ==================================================

    const result = [];


    requestedDates.forEach(
        (date, index) => {

            const weather =
                dailyWeather[date];


            // ------------------------------------------
            // NO REAL FORECAST AVAILABLE
            // ------------------------------------------

            if (!weather) {

                result.push({

                    day: index + 1,

                    date,

                    tempCelsius: null,

                    minTempCelsius: null,

                    maxTempCelsius: null,

                    feelsLikeCelsius: null,

                    condition: 'Unavailable',

                    description:
                        'Live weather forecast is unavailable for this date.',

                    icon: null,

                    humidity: null,

                    windSpeedKmh: null,

                    rainProbability: null,

                    rainfallMm: null,

                    isRealForecast: false,

                    forecastSource: 'unavailable',

                    outdoorScore: null,

                    suitability:
                        'Weather information unavailable',

                    weatherAdvice:
                        'Check the latest weather forecast before travelling.'
                });

                return;
            }


            // ------------------------------------------
            // CALCULATIONS
            // ------------------------------------------

            const averageTemp =
                Math.round(
                    valuesAverage(
                        weather.temperatures
                    )
                );


            const feelsLike =
                Math.round(
                    valuesAverage(
                        weather.feelsLike
                    )
                );


            const minTemp =
                Math.round(
                    Math.min(
                        ...weather.minTemperatures
                    )
                );


            const maxTemp =
                Math.round(
                    Math.max(
                        ...weather.maxTemperatures
                    )
                );


            const humidity =
                Math.round(
                    valuesAverage(
                        weather.humidity
                    )
                );


            /*
             * OpenWeather wind speed is m/s.
             * Convert to km/h.
             */

            const windSpeedKmh =
                Math.round(
                    valuesAverage(
                        weather.windSpeed
                    ) * 3.6
                );


            /*
             * POP is 0-1.
             * Convert to percentage.
             */

            const rainProbability =
                Math.round(
                    valuesAverage(
                        weather.rainProbability
                    ) * 100
                );


            const rainfallMm =
                Math.round(
                    weather.rainfall.reduce(
                        (total, value) =>
                            total + value,
                        0
                    ) * 10
                ) / 10;


            const condition =
                mostCommon(
                    weather.conditions
                );


            const description =
                mostCommon(
                    weather.descriptions
                );


            const icon =
                mostCommon(
                    weather.icons
                );


            // ------------------------------------------
            // OUTDOOR SUITABILITY
            // ------------------------------------------

            const outdoor =
                calculateOutdoorSuitability({
                    condition,
                    rainProbability,
                    rainfallMm,
                    windSpeedKmh,
                    temperature: averageTemp
                });


            // ------------------------------------------
            // FINAL DAILY OBJECT
            // ------------------------------------------

            result.push({

                day: index + 1,

                date,

                tempCelsius:
                    averageTemp,

                minTempCelsius:
                    minTemp,

                maxTempCelsius:
                    maxTemp,

                feelsLikeCelsius:
                    feelsLike,

                condition,

                description,

                icon,

                humidity,

                windSpeedKmh,

                rainProbability,

                rainfallMm,

                isRealForecast: true,

                forecastSource:
                    'OpenWeatherMap',

                outdoorScore:
                    outdoor.score,

                suitability:
                    outdoor.label,

                weatherAdvice:
                    outdoor.advice
            });

        }
    );


    return result;
};


// ======================================================
// REQUESTED DATES
// ======================================================

const getRequestedDates = (
    startDate,
    days
) => {

    const result = [];


    const start =
        parseDateOnly(
            startDate
        );


    for (
        let i = 0;
        i < days;
        i++
    ) {

        const date =
            new Date(start);


        date.setDate(
            start.getDate() + i
        );


        result.push(
            formatDateOnly(date)
        );
    }


    return result;
};


// ======================================================
// PARSE DATE WITHOUT UTC SHIFT
// ======================================================

const parseDateOnly = (
    value
) => {

    if (
        value &&
        /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {

        const [
            year,
            month,
            day
        ] =
            value
                .split('-')
                .map(Number);


        return new Date(
            year,
            month - 1,
            day
        );
    }


    const date =
        new Date(
            value || Date.now()
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return new Date();
    }


    return date;
};


// ======================================================
// FORMAT DATE
// ======================================================

const formatDateOnly = (
    date
) => {

    const yyyy =
        date.getFullYear();


    const mm =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            '0'
        );


    const dd =
        String(
            date.getDate()
        ).padStart(
            2,
            '0'
        );


    return `${yyyy}-${mm}-${dd}`;
};


// ======================================================
// AVERAGE
// ======================================================

const valuesAverage = (
    values
) => {

    const validValues =
        (values || [])
            .map(Number)
            .filter(
                value =>
                    Number.isFinite(value)
            );


    if (
        validValues.length === 0
    ) {

        return 0;
    }


    return (
        validValues.reduce(
            (sum, value) =>
                sum + value,
            0
        ) /
        validValues.length
    );
};


// ======================================================
// MOST COMMON
// ======================================================

const mostCommon = (
    values
) => {

    if (
        !values ||
        values.length === 0
    ) {

        return null;
    }


    const counts = {};


    values.forEach(value => {

        if (!value) {
            return;
        }


        counts[value] =
            (
                counts[value] || 0
            ) + 1;
    });


    return Object.keys(counts)
        .sort(
            (a, b) =>
                counts[b] -
                counts[a]
        )[0] || null;
};


// ======================================================
// OUTDOOR SUITABILITY
// ======================================================

const calculateOutdoorSuitability = ({
    condition,
    rainProbability,
    rainfallMm,
    windSpeedKmh,
    temperature
}) => {

    let score = 100;


    const normalizedCondition =
        String(
            condition || ''
        ).toLowerCase();


    // --------------------------------------------------
    // WEATHER CONDITION
    // --------------------------------------------------

    if (
        normalizedCondition.includes(
            'thunderstorm'
        )
    ) {

        score -= 70;

    } else if (
        normalizedCondition.includes(
            'snow'
        )
    ) {

        score -= 55;

    } else if (
        normalizedCondition.includes(
            'rain'
        )
    ) {

        score -= 40;

    } else if (
        normalizedCondition.includes(
            'drizzle'
        )
    ) {

        score -= 25;

    } else if (
        normalizedCondition.includes(
            'cloud'
        )
    ) {

        score -= 10;
    }


    // --------------------------------------------------
    // RAIN PROBABILITY
    // --------------------------------------------------

    if (
        rainProbability >= 80
    ) {

        score -= 30;

    } else if (
        rainProbability >= 60
    ) {

        score -= 20;

    } else if (
        rainProbability >= 40
    ) {

        score -= 10;

    } else if (
        rainProbability >= 20
    ) {

        score -= 5;
    }


    // --------------------------------------------------
    // ACTUAL RAINFALL
    // --------------------------------------------------

    if (
        rainfallMm >= 20
    ) {

        score -= 25;

    } else if (
        rainfallMm >= 10
    ) {

        score -= 15;

    } else if (
        rainfallMm >= 5
    ) {

        score -= 8;
    }


    // --------------------------------------------------
    // WIND
    // --------------------------------------------------

    if (
        windSpeedKmh >= 45
    ) {

        score -= 25;

    } else if (
        windSpeedKmh >= 35
    ) {

        score -= 15;

    } else if (
        windSpeedKmh >= 25
    ) {

        score -= 5;
    }


    // --------------------------------------------------
    // TEMPERATURE
    // --------------------------------------------------

    if (
        temperature >= 40
    ) {

        score -= 25;

    } else if (
        temperature >= 35
    ) {

        score -= 12;

    } else if (
        temperature < 5
    ) {

        score -= 20;

    } else if (
        temperature < 10
    ) {

        score -= 10;
    }


    score =
        Math.max(
            0,
            Math.min(
                100,
                score
            )
        );


    // --------------------------------------------------
    // LABEL + ADVICE
    // --------------------------------------------------

    let label;
    let advice;


    if (
        score >= 80
    ) {

        label =
            'Excellent for outdoor activities';

        advice =
            'Excellent weather for sightseeing, walking, viewpoints and outdoor attractions.';

    } else if (
        score >= 65
    ) {

        label =
            'Good for sightseeing';

        advice =
            'Good conditions for sightseeing. Outdoor activities are recommended with normal precautions.';

    } else if (
        score >= 50
    ) {

        label =
            'Mixed activities recommended';

        advice =
            'Mix outdoor attractions with indoor activities and keep some flexibility in the schedule.';

    } else {

        label =
            'Prefer indoor activities';

        advice =
            'Consider museums, temples, shopping, cafes and other indoor activities. Avoid long outdoor activities if possible.';
    }


    return {

        score,

        label,

        advice
    };
};


// ======================================================
// SEASONAL ESTIMATE FALLBACK
// ======================================================

const generateSeasonalForecast = (
    latitude,
    longitude,
    startDate,
    days
) => {

    const start =
        parseDateOnly(
            startDate
        );


    const forecast = [];


    for (
        let i = 0;
        i < days;
        i++
    ) {

        const currentDate =
            new Date(start);


        currentDate.setDate(
            start.getDate() + i
        );


        const month =
            currentDate.getMonth();


        const isIndia =
            latitude > 8 &&
            latitude < 37 &&
            longitude > 68 &&
            longitude < 97;


        let baseTemp = 25;

        let condition = 'Clouds';

        let rainProbability = 20;

        let description =
            'Estimated seasonal weather conditions.';


        // ------------------------------------------------
        // INDIA
        // ------------------------------------------------

        if (isIndia) {

            // June - September
            if (
                month >= 5 &&
                month <= 8
            ) {

                baseTemp = 28;

                condition = 'Rain';

                rainProbability = 60;

                description =
                    'Estimated monsoon conditions with possible rain and cloudy skies.';

                // November - February
            } else if (
                month >= 10 ||
                month <= 1
            ) {

                baseTemp = 22;

                condition = 'Clear';

                rainProbability = 15;

                description =
                    'Estimated pleasant and relatively cooler conditions.';

                // March - May
            } else {

                baseTemp = 32;

                condition = 'Clouds';

                rainProbability = 20;

                description =
                    'Estimated warm conditions with partly cloudy skies.';
            }

        } else {

            /*
             * Generic estimate for non-Indian
             * destinations.
             */

            if (
                month >= 5 &&
                month <= 7
            ) {

                baseTemp = 25;

                condition = 'Clear';

                rainProbability = 15;

            } else if (
                month >= 11 ||
                month <= 1
            ) {

                baseTemp = 8;

                condition = 'Clouds';

                rainProbability = 30;

            } else {

                baseTemp = 17;

                condition = 'Clouds';

                rainProbability = 25;
            }
        }


        const minTemp =
            baseTemp - 3;


        const maxTemp =
            baseTemp + 3;


        const outdoor =
            calculateOutdoorSuitability({

                condition,

                rainProbability,

                rainfallMm:
                    condition === 'Rain'
                        ? 5
                        : 0,

                windSpeedKmh:
                    15,

                temperature:
                    baseTemp
            });


        forecast.push({

            day:
                i + 1,

            date:
                formatDateOnly(
                    currentDate
                ),

            tempCelsius:
                baseTemp,

            minTempCelsius:
                minTemp,

            maxTempCelsius:
                maxTemp,

            feelsLikeCelsius:
                baseTemp,

            condition,

            description,

            icon: null,

            humidity: null,

            windSpeedKmh: 15,

            rainProbability,

            rainfallMm:
                condition === 'Rain'
                    ? 5
                    : 0,

            isRealForecast:
                false,

            forecastSource:
                'seasonal-estimate',

            outdoorScore:
                outdoor.score,

            suitability:
                outdoor.label,

            weatherAdvice:
                `${outdoor.advice} This is an estimate, not a live forecast.`
        });
    }


    return forecast;
};


// ======================================================
// EXPORT
// ======================================================

module.exports = {
    getWeatherForecast
};