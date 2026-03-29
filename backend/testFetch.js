const testFetch = async () => {
    try {
        console.log("Testing fetch to google.com...");
        const res = await fetch("https://www.google.com");
        console.log("Status:", res.status);
        console.log("Success!");
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

testFetch();
