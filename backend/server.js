const express = require('express');
const cors = require('cors');
const { getExchangeRate } = require('./services/exchangeRateService');
const { estimateBudget, generateItinerary } = require('./services/aiEstimationService');
const { getCountryAndCurrency, searchLocations, getLandmarks } = require('./services/locationService');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    const results = await searchLocations(q);
    res.json(results);
});

app.post('/api/calculate', async (req, res) => {
    const { destination, days, budgetINR, travelType } = req.body;

    try {
        // 1. Resolve location details first to get the most accurate name
        const locationDetails = await getCountryAndCurrency(destination);
        const { currencyCode, isIndia, countryName, resolvedName, parentLocation } = locationDetails;

        // 2. Fetch landmarks using both specific and parent names to ensure density
        const landmarks = await getLandmarks(`${resolvedName}, ${parentLocation}`);

        let rate = 1;
        let convertedBudget = budgetINR;
        let displayCurrency = 'INR';

        if (!isIndia) {
            rate = await getExchangeRate(currencyCode);
            convertedBudget = budgetINR * rate;
            displayCurrency = currencyCode;
        }
        
        const { breakdown, suggestions } = estimateBudget(convertedBudget, travelType, countryName);
        
        const dailyBreakdown = {
            food: breakdown.food / days,
            stay: breakdown.stay / days,
            transport: breakdown.transport / days,
            activities: breakdown.activities / days
        };

        const itinerary = generateItinerary(resolvedName || destination, days, travelType, dailyBreakdown, landmarks);

        // Save to DB (Handle gracefully if DB is not setup)
        try {
            await db.query(
                `INSERT INTO trips (destination_country, days, budget_inr, travel_type, converted_budget, currency_code, exchange_rate, breakdown, suggestions) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [countryName, days, budgetINR, travelType, convertedBudget, currencyCode, rate, breakdown, suggestions]
            );
        } catch (dbErr) {
            if (dbErr.code !== 'ECONNREFUSED') {
                console.error('DB Insert Error:', dbErr.message);
            }
        }

        res.json({
            destination: resolvedName || destination,
            country: countryName,
            originalInput: destination,
            days,
            budgetINR,
            convertedBudget,
            currencyCode,
            currencySymbol: isIndia ? '₹' : locationDetails.currencySymbol,
            rate,
            isIndia,
            dailyBudget: convertedBudget / days,
            breakdown,
            suggestions,
            itinerary
        });
    } catch (error) {
        console.error('Calculation Error:', error.message);
        res.status(500).json({ error: error.message || 'Calculation failed' });
    }
});

app.get('/api/history', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM trips ORDER BY created_at DESC LIMIT 10');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
