const axios = require('axios');

const cache = new Map(); // Simple weather cache

const getWeatherForecast = async (latitude, longitude, startDate, days) => {
    const safeDays = parseInt(days) || 1;
    const key = `${latitude.toFixed(2)},${longitude.toFixed(2)},${startDate},${safeDays}`;
    if (cache.has(key)) {
        return cache.get(key);
    }

    const apiKey = (process.env.WEATHER_API_KEY || "").trim();
    let forecastData = null;

    if (apiKey && apiKey !== "your_api_key_here") {
        try {
            console.log(`[Weather] Using OpenWeatherMap API for coordinates: ${latitude}, ${longitude}`);
            const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
                params: {
                    lat: latitude,
                    lon: longitude,
                    appid: apiKey,
                    units: 'metric'
                },
                timeout: 5000
            });
            if (response.data && response.data.list) {
                const list = response.data.list;
                const dailyWeather = {};
                
                list.forEach(item => {
                    const date = item.dt_txt.split(' ')[0];
                    if (!dailyWeather[date]) {
                        dailyWeather[date] = { temps: [], conditions: [] };
                    }
                    dailyWeather[date].temps.push(item.main.temp);
                    dailyWeather[date].conditions.push(item.weather[0].main);
                });

                forecastData = Object.keys(dailyWeather).map((date, idx) => {
                    const temps = dailyWeather[date].temps;
                    const conditions = dailyWeather[date].conditions;
                    const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
                    
                    const conditionCounts = {};
                    let primaryCondition = 'Clear';
                    let maxCount = 0;
                    conditions.forEach(cond => {
                        conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;
                        if (conditionCounts[cond] > maxCount) {
                            maxCount = conditionCounts[cond];
                            primaryCondition = cond;
                        }
                    });
                    
                    return {
                        day: idx + 1,
                        date: date,
                        tempCelsius: avgTemp,
                        condition: primaryCondition,
                        description: `Average temperature: ${avgTemp}°C with ${primaryCondition.toLowerCase()} skies.`
                    };
                });
                
                // Crop to the requested number of days
                forecastData = forecastData.slice(0, safeDays);
            }
        } catch (error) {
            console.error('[Weather] OpenWeatherMap API Error:', error.message);
        }
    }

    // Fallback: Generate seasonal weather patterns based on month
    if (!forecastData || forecastData.length === 0) {
        console.log(`[Weather] Generating seasonal forecast fallback...`);
        const travelMonth = new Date(startDate || Date.now()).getMonth(); // 0-11
        let baseTemp = 25;
        let mainCondition = 'Clear';
        let description = 'Sunny and clear skies.';
        
        const isIndia = latitude > 8 && latitude < 37 && longitude > 68 && longitude < 97;
        const isSouthernHemisphere = latitude < 0;

        if (isIndia) {
            if (travelMonth >= 5 && travelMonth <= 8) { // June - Sept
                baseTemp = 28;
                mainCondition = 'Rain';
                description = 'Monsoon rains, high humidity, overcast skies.';
            } else if (travelMonth >= 10 || travelMonth <= 1) { // Nov - Feb
                baseTemp = 20;
                mainCondition = 'Clear';
                description = 'Pleasant weather, clear sunny skies, cool breeze.';
            } else { // Mar - May (Hot)
                baseTemp = 35;
                mainCondition = 'Clouds';
                description = 'Hot summer days, partly cloudy skies.';
            }
        } else {
            const adjustedMonth = isSouthernHemisphere ? (travelMonth + 6) % 12 : travelMonth;
            if (adjustedMonth >= 5 && adjustedMonth <= 8) { // Summer
                baseTemp = 26;
                mainCondition = 'Clear';
                description = 'Warm summer day, bright and sunny.';
            } else if (adjustedMonth >= 11 || adjustedMonth <= 1) { // Winter
                baseTemp = 5;
                mainCondition = 'Clouds';
                description = 'Chilly winter day, overcast skies.';
            } else { // Spring / Autumn
                baseTemp = 15;
                mainCondition = 'Clouds';
                description = 'Mild weather, partly cloudy skies.';
            }
        }

        forecastData = [];
        const start = new Date(startDate || Date.now());
        
        for (let i = 1; i <= safeDays; i++) {
            const currentDate = new Date(start);
            currentDate.setDate(start.getDate() + i - 1);
            
            // Format to YYYY-MM-DD
            const yyyy = currentDate.getFullYear();
            const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
            const dd = String(currentDate.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            
            const dailyTemp = Math.round(baseTemp + (Math.random() * 4 - 2));
            let dayCondition = mainCondition;
            let dayDesc = description;
            
            if (mainCondition === 'Clear' && Math.random() < 0.2) {
                dayCondition = 'Clouds';
                dayDesc = 'Partly cloudy with mild conditions.';
            } else if (mainCondition === 'Rain' && Math.random() < 0.25) {
                dayCondition = 'Clouds';
                dayDesc = 'Brief break from rains, overcast and humid.';
            }

            forecastData.push({
                day: i,
                date: dateStr,
                tempCelsius: dailyTemp,
                condition: dayCondition,
                description: dayDesc
            });
        }
    }

    cache.set(key, forecastData);
    return forecastData;
};

module.exports = { getWeatherForecast };
