const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const generateItineraryWithGemini = async (destination, days, travelType, dailyAverage) => {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_key_here') {
        console.warn("Gemini API Key missing. Falling back to rule-based itinerary.");
        return null;
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Act as a professional travel planner. Generate a highly specific, accurate, and realistic day-wise travel itinerary for a ${days}-day ${travelType} trip to ${destination}.
            
            The traveler has a daily budget approximately as follows (in local currency or INR as appropriate):
            - Food: ${dailyAverage.food}
            - Stay: ${dailyAverage.stay}
            - Transport: ${dailyAverage.transport}
            - Activities: ${dailyAverage.activities}

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

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean the response in case Gemini adds markdown code blocks
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Generation Error:", error.message);
        return null;
    }
};

module.exports = { generateItineraryWithGemini };
