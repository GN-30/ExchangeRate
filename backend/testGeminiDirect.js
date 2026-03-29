const testFetchGemini = async () => {
    try {
        console.log("Testing fetch to Gemini API...");
        const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash?key=AIzaSyCQB8GzGqKCfw5Nrc3Nt8bSyyq-YqvNHyg");
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Data:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Fetch FAILED!");
        console.error("Name:", err.name);
        console.error("Message:", err.message);
        if (err.cause) {
            console.error("Cause Name:", err.cause.name);
            console.error("Cause Message:", err.cause.message);
            console.error("Cause Code:", err.cause.code);
        }
    }
};

testFetchGemini();
