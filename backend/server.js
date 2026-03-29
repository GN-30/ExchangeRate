const express = require('express');
const cors = require('cors');
const { getExchangeRate } = require('./services/exchangeRateService');
const { estimateBudget, generateItinerary } = require('./services/aiEstimationService');
const { getCountryAndCurrency, searchLocations, getLandmarks } = require('./services/locationService');
const db = require('./db');
const { register, login } = require('./services/authService');
const { getChatbotResponse } = require('./services/chatService');
const authMiddleware = require('./middleware/auth');
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
    let userId = null;
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
        try {
            const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'secret_key');
            userId = decoded.id;
        } catch (e) {}
    }

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
        
        const { breakdown, suggestions } = await estimateBudget(convertedBudget, travelType, countryName);
        
        const dailyBreakdown = {
            food: breakdown.food / days,
            stay: breakdown.stay / days,
            transport: breakdown.transport / days,
            activities: breakdown.activities / days
        };

        console.log(`Calculating itinerary for ${destination}...`);
        const itinerary = await generateItinerary(resolvedName || destination, days, travelType, dailyBreakdown, landmarks);
        console.log("Itinerary generation complete.");

        // Save to DB (Handle gracefully if DB is not setup)
        let newTripId = null;
        try {
            const tripRes = await db.query(
                `INSERT INTO trips (user_id, destination_country, days, budget_inr, travel_type, converted_budget, currency_code, exchange_rate, breakdown, suggestions, itinerary) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
                [userId, countryName, days, budgetINR, travelType, convertedBudget, currencyCode, rate, JSON.stringify(breakdown), JSON.stringify(suggestions), JSON.stringify(itinerary)]
            );
            if (tripRes.rows.length > 0) newTripId = tripRes.rows[0].id;
        } catch (dbErr) {
            if (dbErr.code !== 'ECONNREFUSED') {
                console.error('DB Insert Error:', dbErr.message);
            }
        }

        res.json({
            id: newTripId,
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

app.get('/api/history', authMiddleware, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM trips WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const result = await register(name, email, password);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await login(email, password);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
        const result = await db.query('SELECT id, name, email, preferences FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Chatbot Route
app.post('/api/chat', async (req, res) => {
    try {
        let userId = null;
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            try {
                const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'secret_key');
                userId = decoded.id;
            } catch (e) {}
        }
        
        const { message } = req.body;
        const reply = await getChatbotResponse(message, userId);
        res.json({ reply });
    } catch (err) {
        res.status(500).json({ error: 'Chatbot error' });
    }
});

// Trips Routes
app.get('/api/trips/:id', authMiddleware, async (req, res) => {
    try {
        if (req.params.id === 'latest') {
            const result = await db.query('SELECT * FROM trips WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [req.user.id]);
            if (result.rows.length === 0) return res.json(null);
            return res.json(result.rows[0]);
        }
        const result = await db.query('SELECT * FROM trips WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch trip' });
    }
});

// Expenses Routes
app.get('/api/expenses', authMiddleware, async (req, res) => {
    try {
        const tripId = req.query.tripId;
        if (!tripId || tripId === 'null') return res.json([]);
        const result = await db.query('SELECT * FROM expenses WHERE user_id = $1 AND trip_id = $2 ORDER BY date DESC', [req.user.id, tripId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.post('/api/expenses', authMiddleware, async (req, res) => {
    try {
        const { trip_id, category, amount_inr, amount_local, description, date } = req.body;
        if (!trip_id) return res.status(400).json({ error: 'trip_id is required' });
        const result = await db.query(
            'INSERT INTO expenses (trip_id, user_id, category, amount_inr, amount_local, description, date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [trip_id, req.user.id, category, amount_inr, amount_local, description, date]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.delete('/api/expenses/:id', authMiddleware, async (req, res) => {
    try {
        await db.query('DELETE FROM expenses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
});

// Alerts Routes
app.get('/api/alerts', authMiddleware, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM alerts WHERE user_id = $1', [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.post('/api/alerts', authMiddleware, async (req, res) => {
    try {
        const { currency_code, target_rate, condition } = req.body;
        const result = await db.query(
            'INSERT INTO alerts (user_id, currency_code, target_rate, condition) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, currency_code, target_rate, condition]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
});

// Mock Historical Rates Endpoint (Realistic 30-day random walk)
app.get('/api/history/rates/:searchTerm', async (req, res) => {
    try {
        let currencyCode = req.params.searchTerm;
        
        // If the searchTerm is likely a country name (e.g., 'Indonesia') instead of 'IDR'
        if (currencyCode.length > 3 || currencyCode !== currencyCode.toUpperCase()) {
            try {
                const { getCountryAndCurrency } = require('./services/locationService');
                const details = await getCountryAndCurrency(currencyCode);
                currencyCode = details.currencyCode;
            } catch(e) {
                // If resolving fails, keep the term or fallback
                console.warn("Could not resolve location:", currencyCode);
            }
        }
        
        const baseRate = await require('./services/exchangeRateService').getExchangeRate(currencyCode) || 1;
        const data = [];
        let currentRate = baseRate;
        const volatility = 0.005; // 0.5% max daily fluctuation
        
        for(let i = 29; i >= 0; i--) {
            // Random walk: previous rate * (1 +/- volatility)
            const change = 1 + (Math.random() * (volatility * 2) - volatility);
            currentRate = currentRate * change;
            
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            data.push({ 
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
                rate: parseFloat(currentRate.toFixed(4)),
                currency: currencyCode
            });
        }
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch historical rates' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
