const axios = require('axios');
require('dotenv').config();

console.log("Gemini Service (Axios) Loaded. Key Present:", !!process.env.GEMINI_API_KEY);

const generateItineraryWithGemini = async (destination, days, travelType, dailyAverage) => {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey || apiKey === 'your_key_here') {
        console.warn("Gemini API Key missing or placeholder. Falling back.");
        return null;
    }

    console.log(`Generating itinerary for ${destination} (${days} days, ${travelType})...`);

    try {
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const prompt = `
            Act as a professional travel planner. Generate a highly specific, accurate, and realistic day-wise travel itinerary for a ${days}-day ${travelType} trip to ${destination}.
            
            The traveler has a daily budget approximately as follows (in local currency or INR as appropriate):
            - Food: ${dailyAverage ? dailyAverage.food : 'Standard'}
            - Stay: ${dailyAverage ? dailyAverage.stay : 'Standard'}
            - Transport: ${dailyAverage ? dailyAverage.transport : 'Standard'}
            - Activities: ${dailyAverage ? dailyAverage.activities : 'Standard'}

            For EACH day, provide exactly 3 main activities (Morning, Afternoon, Evening).
            Be specific: Mention actual names of landmarks, restaurants, neighborhoods, or hidden gems.
            The response MUST be a valid JSON array of objects with the following structure:
            [
              {
                "day": 1,
                "title": "Day 1: Specific Theme/Neighborhood",
                "activities": [
                  { "text": "Morning: Visit [Specific Landmark Name]", "cost": estimated_cost_number },
                  { "text": "Afternoon: Explore [Specific Area/Activity]", "cost": estimated_cost_number },
                  { "text": "Evening: Dinner at [Specific Type of Place or Area]", "cost": estimated_cost_number }
                ],
                "costs": {
                  "food": number,
                  "stay": number,
                  "transport": number,
                  "activities": total_activities_cost_number
                }
              },
              ...
            ]

            Constraints:
            - Return ONLY the raw JSON array. No markdown, no extra text.
            - Ensure costs are realistic based on the provided budget.
            - Make sure the landmarks are actually in or near ${destination}.
        `;

        console.log("Sending request to Gemini via Axios...");
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048
            }
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000 // 60 seconds
        });

        const text = response.data.candidates[0].content.parts[0].text;
        console.log("Raw Gemini Response received. Length:", text.length);
        
        let parsedData = null;
        try {
            parsedData = JSON.parse(text);
        } catch (e) {
            console.log("JSON Parse failed, attempting cleanup...");
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                parsedData = JSON.parse(jsonMatch[0]);
            } else {
                throw e;
            }
        }
        
        console.log("Successfully parsed JSON. Days count:", parsedData.length);
        return parsedData;
    } catch (error) {
        console.error("Gemini Axios Error:", error.message);
        if (error.response) {
            console.error("Error Status:", error.response.status);
            console.error("Error Data:", JSON.stringify(error.response.data, null, 2));
        }
        return null;
    }
};

module.exports = { generateItineraryWithGemini };
