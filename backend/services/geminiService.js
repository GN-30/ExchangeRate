const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

console.log("Gemini Service (GoogleGenAI SDK) Loaded. Key Present:", !!process.env.GEMINI_API_KEY);

const generateItineraryWithGemini = async ({
    destination,
    days,
    travelType,
    budget,
    travelers,
    interests,
    pace,
    weatherForecast,
    candidatePlaces
}) => {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey || apiKey === 'your_new_gemini_api_key_here' || apiKey === 'your_key_here') {
        console.warn("Gemini API Key missing or placeholder. Falling back.");
        return null;
    }

    // Prepare prompt
    const placesContext = candidatePlaces.map(p => ({
        placeId: p.placeId,
        name: p.name,
        latitude: p.latitude,
        longitude: p.longitude,
        rating: p.rating,
        category: p.category,
        address: p.address,
        types: p.types
    }));

    const prompt = `
You are a professional travel planner and itinerary optimization engine.
You are NOT a geographic database. You MUST use ONLY the verified places supplied in the "candidatePlaces" array below.

Never invent, hallucinate, rename, substitute, or add tourist attractions, restaurants, hotels, landmarks, addresses, coordinates, ratings, opening hours, or travel times.
Every location in your response MUST contain a valid placeId from the supplied candidate-place dataset.

Trip Details:
- Destination: ${destination}
- Duration: ${days} days
- Budget (INR): ${budget}
- Travelers: ${travelers}
- Travel Style: ${travelType} (solo, couple, friends, family)
- Interests: ${interests.join(', ')}
- Preferred Pace: ${pace} (relaxed, moderate, packed)

Weather Forecast per Day:
${JSON.stringify(weatherForecast, null, 2)}

Candidate Places to choose from (Use ONLY these):
${JSON.stringify(placesContext, null, 2)}

Instructions:
1. Generate a day-by-day itinerary for exactly ${days} days.
2. Group geographically close locations together on the same day to minimize travel time.
3. Align activities with weather conditions (e.g., if rain is forecast for a day, prioritize indoor/museum categories; if clear, prioritize waterfalls/nature/outdoors).
4. Respect the pacing preference:
   - "relaxed": 1-2 activities per day
   - "moderate": 2-3 activities per day
   - "packed": 3-4 activities per day
5. Keep within the budget constraints.
6. Return a valid JSON object matching the following structure:
{
  "destination": "${destination}",
  "summary": "Short 1-2 sentence description of the trip and theme.",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "Daily theme name",
      "activities": [
        {
          "placeId": "Must be exactly one of the placeId strings from the candidate places list",
          "name": "Name of the place",
          "startTime": "HH:MM",
          "endTime": "HH:MM",
          "durationMinutes": number,
          "travelFromPreviousMinutes": number,
          "reason": "Why this place is suitable for this day (considering interests, weather, or pace)."
        }
      ]
    }
  ]
}

Strict Rule: Output ONLY the raw JSON matching this structure. No markdown wrappers.
`;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2
            }
        });

        console.log(`[Gemini] Requesting itinerary generation for ${destination} using SDK...`);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        let parsedData = null;
        try {
            parsedData = JSON.parse(text);
        } catch (e) {
            console.log("[Gemini] JSON parse failed on SDK output, cleaning markdown...");
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsedData = JSON.parse(jsonMatch[0]);
            } else {
                throw e;
            }
        }

        return parsedData;
    } catch (error) {
        console.error("[Gemini] SDK generation failed:", error.message);
        
        // Axios REST Fallback
        try {
            console.log("[Gemini] Attempting Axios REST fallback...");
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const response = await axios.post(url, {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.2
                }
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 45000
            });

            const restText = response.data.candidates[0].content.parts[0].text;
            return JSON.parse(restText);
        } catch (fallbackError) {
            console.error("[Gemini] Axios REST fallback also failed:", fallbackError.message);
            return null;
        }
    }
};

module.exports = { generateItineraryWithGemini };
