const { generateItineraryWithGemini } = require('./services/geminiService');
require('dotenv').config();

const test = async () => {
    console.log("Starting Standalone Gemini Test...");
    console.log("ENV Key exists:", !!process.env.GEMINI_API_KEY);
    
    const result = await generateItineraryWithGemini(
        "Tokyo", 
        2, 
        "luxury", 
        { food: 5000, stay: 15000, transport: 2000, activities: 3000 }
    );
    
    if (result) {
        console.log("Test SUCCESS!");
        console.log(JSON.stringify(result, null, 2));
    } else {
        console.log("Test FAILED: Result was null.");
    }
};

test();
