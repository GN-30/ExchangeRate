const ESTIMATION_LOGIC = {
    budget: { food: 0.3, stay: 0.4, transport: 0.2, activities: 0.1 },
    luxury: { food: 0.25, stay: 0.5, transport: 0.15, activities: 0.1 },
    family: { food: 0.35, stay: 0.35, transport: 0.15, activities: 0.15 },
    solo: { food: 0.3, stay: 0.3, transport: 0.3, activities: 0.1 },
};

// Region-based cost modifiers
const REGION_MODIFIERS = {
    'Europe': { stay: 1.2, transport: 1.1 },
    'Asia': { stay: 0.8, food: 0.9 },
    'Americas': { stay: 1.3, food: 1.1 },
    'Africa': { transport: 1.2 },
    'Oceania': { stay: 1.2, transport: 1.2 },
    'India': { food: 0.7, stay: 0.7, transport: 0.6 } // Deep discount for India domestic
};

const SUGGESTIONS = [
    "Best time to exchange currency is usually mid-week when markets are stable.",
    "Consider using a multi-currency card to avoid high conversion fees.",
    "Monitor exchange rate trends for a few weeks before your trip.",
    "Local street food is often both cheaper and more authentic.",
    "Public transport is a great way to save on daily expenses.",
    "Book stay in advance for better rates in popular tourist spots.",
    "Check for city-specific travel passes for unlimited public transport."
];

const ITINERARY_TEMPLATES = {
    budget: [
        "Morning: Visit local free landmarks and gardens.",
        "Afternoon: Explore local markets and street food.",
        "Evening: Enjoy a sunset walk or local park visit."
    ],
    luxury: [
        "Morning: Private guided tour of historical sites.",
        "Afternoon: Fine dining and high-end shopping.",
        "Evening: Premium entertainment or spa session."
    ],
    family: [
        "Morning: Family-friendly museum or theme park.",
        "Afternoon: Group picnic or interactive workshops.",
        "Evening: Kids-friendly dinner and leisure walk."
    ],
    solo: [
        "Morning: Hidden gems and local coffee spots.",
        "Afternoon: Solo trek or photography tour.",
        "Evening: Social hostel event or quiet reading at a view point."
    ]
};

const { generateItineraryWithGemini } = require('./geminiService');

const generateItinerary = async (destination, days, travelType, dailyAverage = null, landmarks = []) => {
    // Try Gemini first for "Specific and Accurate" results
    const geminiItinerary = await generateItineraryWithGemini(destination, days, travelType, dailyAverage);
    if (geminiItinerary) {
        console.log("Successfully generated specific itinerary using Gemini.");
        return geminiItinerary;
    }

    // Fallback to Rule-based logic
    console.log("Using rule-based fallback for itinerary.");
    const itinerary = [];
    const activitiesPerDay = 3;
    
    let landmarkIndex = 0;
    
    for (let i = 1; i <= days; i++) {
        const dailyActivities = [];
        
        let totalDailyActivitiesCost = 0;
        const jitter = 0.85 + (Math.random() * 0.3);
        const currentDailyFood = dailyAverage ? dailyAverage.food * jitter : 0;
        const currentDailyStay = dailyAverage ? dailyAverage.stay : 0;
        const currentDailyTransport = dailyAverage ? dailyAverage.transport * (0.8 + Math.random() * 0.4) : 0;
        
        for (let j = 0; j < activitiesPerDay; j++) {
            const timeStr = j === 0 ? "Morning" : j === 1 ? "Afternoon" : "Evening";
            let costFactor = 0.2;
            let activityText = "";

            let landmarkData = null;

            if (landmarkIndex < landmarks.length) {
                const landmark = landmarks[landmarkIndex];
                activityText = `${timeStr}: Visit ${landmark.name}`;
                landmarkData = landmark;
                landmarkIndex++;
                
                const name = landmark.name.toLowerCase();
                if (name.includes('museum') || name.includes('art') || name.includes('gallery')) costFactor = 0.6;
                else if (name.includes('tower') || name.includes('palace') || name.includes('castle')) costFactor = 0.8;
                else if (name.includes('park') || name.includes('garden') || name.includes('square')) costFactor = 0.1;
                else if (name.includes('temple') || name.includes('church') || name.includes('cathedral')) costFactor = 0.2;
                else if (j === 1) costFactor = 0.5;
            } else {
                const template = (ITINERARY_TEMPLATES[travelType] || ITINERARY_TEMPLATES.budget)[j];
                activityText = template.replace("local", destination).replace("Destination", destination);
                if (j === 1) costFactor = 0.6;
            }

            const cost = dailyAverage ? Math.round(dailyAverage.activities * costFactor * jitter) : 0;
            totalDailyActivitiesCost += cost;

            dailyActivities.push({
                text: activityText,
                cost: cost,
                landmark: landmarkData
            });
        }

        itinerary.push({
            day: i,
            title: `Day ${i}: ${destination} Exploration`,
            activities: dailyActivities,
            costs: dailyAverage ? {
                food: Math.round(currentDailyFood),
                stay: Math.round(currentDailyStay),
                transport: Math.round(currentDailyTransport),
                activities: totalDailyActivitiesCost
            } : null
        });
    }
    return itinerary;
};

const estimateBudget = async (totalBudget, travelType, countryName = '') => {
    let ratios = { ...(ESTIMATION_LOGIC[travelType] || ESTIMATION_LOGIC.budget) };

    if (countryName.toLowerCase().includes('india')) {
        ratios.food *= 0.7;
        ratios.stay *= 0.7;
        ratios.transport *= 0.6;
    }

    const total = Object.values(ratios).reduce((a, b) => a + b, 0);
    Object.keys(ratios).forEach(key => ratios[key] /= total);

    const breakdown = {
        food: totalBudget * ratios.food,
        stay: totalBudget * ratios.stay,
        transport: totalBudget * ratios.transport,
        activities: totalBudget * ratios.activities,
    };

    const tripSuggestions = SUGGESTIONS.sort(() => 0.5 - Math.random()).slice(0, 3);
    if (countryName.toLowerCase().includes('india')) {
        tripSuggestions.unshift("Download UPI apps or carry small cash for local vendors in India.");
    }

    return { breakdown, suggestions: tripSuggestions };
};

module.exports = { estimateBudget, generateItinerary };
