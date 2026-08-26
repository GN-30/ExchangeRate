require('dotenv').config();

const listModels = async () => {
    try {
        const apiKey = process.env.GEMINI_API_KEY || "";
        console.log("Listing models...");
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await res.json();
        console.log("Models:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("List Models FAILED!", err);
    }
};

listModels();
