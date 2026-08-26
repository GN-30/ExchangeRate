const express = require('express');
const cors = require('cors');

require('dotenv').config();

// ======================================================
// SERVICES
// ======================================================

const {
    getExchangeRate
} = require('./services/exchangeRateService');

const {
    estimateBudget,
    generateItinerary
} = require('./services/aiEstimationService');

const {
    getCountryAndCurrency,
    searchLocations,
    getLandmarks
} = require('./services/locationService');

const db = require('./db');

const {
    register,
    login
} = require('./services/authService');

const {
    getChatbotResponse
} = require('./services/chatService');

const authMiddleware =
    require('./middleware/auth');

const {
    startAlertWorker
} = require('./services/alertWorker');


// ======================================================
// APP SETUP
// ======================================================

const app = express();

app.use(cors());

app.use(express.json());

const PORT =
    process.env.PORT || 5000;


// ======================================================
// HEALTH CHECK
// ======================================================

app.get('/api/health', (req, res) => {

    res.json({
        status: 'OK',
        message: 'Server is running'
    });

});


// ======================================================
// LOCATION SEARCH
//
// Used by:
// - PlanTrip autocomplete
// - Trends autocomplete
//
// Minimum 3 characters.
// locationService handles:
// - caching
// - Nominatim queue
// - 429 retry
// ======================================================

app.get('/api/search', async (req, res) => {

    try {

        const query =
            String(req.query.q || '').trim();


        if (query.length < 3) {

            return res.json([]);

        }


        console.log(
            `[Search] Searching locations for: ${query}`
        );


        const results =
            await searchLocations(query);


        res.json(results);


    } catch (error) {

        console.error(
            '[Search] Route error:',
            error.message
        );


        res.status(500).json({
            error:
                'Failed to search locations'
        });

    }

});


// ======================================================
// ITINERARY ROUTES
// ======================================================

const itineraryRoutes =
    require('./routes/itineraryRoutes');

app.use(
    '/api',
    itineraryRoutes
);


// ======================================================
// USER TRIP HISTORY
// ======================================================

app.get(
    '/api/history',
    authMiddleware,
    async (req, res) => {

        try {

            const result =
                await db.query(
                    `SELECT *
                     FROM trips
                     WHERE user_id = $1
                     ORDER BY created_at DESC
                     LIMIT 50`,
                    [req.user.id]
                );

            res.json(result.rows);

        } catch (error) {

            console.error(
                'Trip history error:',
                error.message
            );

            res.status(500).json({
                error:
                    'Failed to fetch history'
            });

        }

    }
);


// ======================================================
// AUTH - REGISTER
// ======================================================

app.post(
    '/api/auth/register',
    async (req, res) => {

        try {

            const {
                name,
                email,
                password
            } = req.body;

            const result =
                await register(
                    name,
                    email,
                    password
                );

            res.json(result);

        } catch (err) {

            res.status(400).json({
                error:
                    err.message
            });

        }

    }
);


// ======================================================
// AUTH - LOGIN
// ======================================================

app.post(
    '/api/auth/login',
    async (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;

            const result =
                await login(
                    email,
                    password
                );

            res.json(result);

        } catch (err) {

            res.status(400).json({
                error:
                    err.message
            });

        }

    }
);


// ======================================================
// AUTH - CURRENT USER
// ======================================================

app.get(
    '/api/auth/me',
    authMiddleware,
    async (req, res) => {

        try {

            const result =
                await db.query(
                    `SELECT
                        id,
                        name,
                        email,
                        preferences
                     FROM users
                     WHERE id = $1`,
                    [req.user.id]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({
                    error:
                        'User not found'
                });

            }


            res.json(
                result.rows[0]
            );

        } catch (err) {

            console.error(
                'Auth/me error:',
                err.message
            );

            res.status(500).json({
                error:
                    'Server error'
            });

        }

    }
);


// ======================================================
// CHATBOT
// ======================================================

app.post(
    '/api/chat',
    async (req, res) => {

        try {

            let userId = null;


            const token =
                req
                    .header('Authorization')
                    ?.replace(
                        'Bearer ',
                        ''
                    );


            if (token) {

                try {

                    const decoded =
                        require('jsonwebtoken')
                            .verify(
                                token,
                                process.env.JWT_SECRET ||
                                'secret_key'
                            );

                    userId =
                        decoded.id;

                } catch (e) {

                    // Anonymous user

                }

            }


            const {
                message
            } = req.body;


            const reply =
                await getChatbotResponse(
                    message,
                    userId
                );


            res.json({
                reply
            });


        } catch (err) {

            console.error(
                'Chatbot error:',
                err.message
            );

            res.status(500).json({
                error:
                    'Chatbot error'
            });

        }

    }
);


// ======================================================
// TRIPS
// ======================================================

app.get(
    '/api/trips/:id',
    authMiddleware,
    async (req, res) => {

        try {

            if (
                req.params.id === 'latest'
            ) {

                const result =
                    await db.query(
                        `SELECT *
                         FROM trips
                         WHERE user_id = $1
                         ORDER BY created_at DESC
                         LIMIT 1`,
                        [req.user.id]
                    );


                if (
                    result.rows.length === 0
                ) {

                    return res.json(null);

                }


                return res.json(
                    result.rows[0]
                );

            }


            const result =
                await db.query(
                    `SELECT *
                     FROM trips
                     WHERE id = $1
                     AND user_id = $2`,
                    [
                        req.params.id,
                        req.user.id
                    ]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({
                    error:
                        'Trip not found'
                });

            }


            res.json(
                result.rows[0]
            );


        } catch (err) {

            console.error(
                'Trip fetch error:',
                err.message
            );

            res.status(500).json({
                error:
                    'Failed to fetch trip'
            });

        }

    }
);


// ======================================================
// EXPENSES - GET
// ======================================================

app.get(
    '/api/expenses',
    authMiddleware,
    async (req, res) => {

        try {

            const tripId =
                req.query.tripId;


            if (
                !tripId ||
                tripId === 'null'
            ) {

                return res.json([]);

            }


            const result =
                await db.query(
                    `SELECT *
                     FROM expenses
                     WHERE user_id = $1
                     AND trip_id = $2
                     ORDER BY date DESC`,
                    [
                        req.user.id,
                        tripId
                    ]
                );


            res.json(
                result.rows
            );


        } catch (err) {

            console.error(
                'Expense fetch error:',
                err.message
            );

            res.status(500).json({
                error:
                    'Failed'
            });

        }

    }
);


// ======================================================
// EXPENSES - CREATE
// ======================================================

app.post(
    '/api/expenses',
    authMiddleware,
    async (req, res) => {

        try {

            const {
                trip_id,
                category,
                amount_inr,
                amount_local,
                description,
                date
            } = req.body;


            if (!trip_id) {

                return res.status(400).json({
                    error:
                        'trip_id is required'
                });

            }


            const result =
                await db.query(
                    `INSERT INTO expenses
                    (
                        trip_id,
                        user_id,
                        category,
                        amount_inr,
                        amount_local,
                        description,
                        date
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7
                    )
                    RETURNING *`,
                    [
                        trip_id,
                        req.user.id,
                        category,
                        amount_inr,
                        amount_local,
                        description,
                        date
                    ]
                );


            res.json(
                result.rows[0]
            );


        } catch (err) {

            console.error(
                'Expense creation error:',
                err.message
            );

            res.status(500).json({
                error:
                    'Failed'
            });

        }

    }
);


// ======================================================
// EXPENSES - DELETE
// ======================================================

app.delete(
    '/api/expenses/:id',
    authMiddleware,
    async (req, res) => {

        try {

            await db.query(
                `DELETE FROM expenses
                 WHERE id = $1
                 AND user_id = $2`,
                [
                    req.params.id,
                    req.user.id
                ]
            );


            res.json({
                success:
                    true
            });


        } catch (err) {

            console.error(
                'Expense delete error:',
                err.message
            );

            res.status(500).json({
                error:
                    'Failed'
            });

        }

    }
);


// ======================================================
// ALERTS - GET
// ======================================================

app.get(
    '/api/alerts',
    authMiddleware,
    async (req, res) => {

        try {

            const result =
                await db.query(
                    `SELECT *
                     FROM alerts
                     WHERE user_id = $1`,
                    [req.user.id]
                );


            res.json(
                result.rows
            );


        } catch (err) {

            console.error(
                'Alert fetch error:',
                err.message
            );

            res.status(500).json({
                error:
                    'Failed'
            });

        }

    }
);


// ======================================================
// ALERTS - CREATE
// ======================================================

app.post(
    '/api/alerts',
    authMiddleware,
    async (req, res) => {

        try {

            const {
                currency_code,
                target_rate,
                condition
            } = req.body;


            const result =
                await db.query(
                    `INSERT INTO alerts
                    (
                        user_id,
                        currency_code,
                        target_rate,
                        condition
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4
                    )
                    RETURNING *`,
                    [
                        req.user.id,
                        currency_code,
                        target_rate,
                        condition
                    ]
                );


            res.json(
                result.rows[0]
            );


        } catch (err) {

            console.error(
                'Alert creation error:',
                err.message
            );

            res.status(500).json({
                error:
                    'Failed'
            });

        }

    }
);


// ======================================================
// TEST EMAIL
// ======================================================

app.post(
    '/api/auth/test-email',
    authMiddleware,
    async (req, res) => {

        try {

            const {
                sendAlertEmail
            } =
                require('./services/emailService');


            await sendAlertEmail(
                req.user.email,
                req.user.name || 'User',
                {
                    currency:
                        'TEST',

                    targetRate:
                        '1.0',

                    currentRate:
                        '1.0',

                    condition:
                        'equal'
                }
            );


            res.json({
                message:
                    `Test email sent to ${req.user.email}`
            });


        } catch (err) {

            console.error(
                'Test email error:',
                err.message
            );


            res.status(500).json({
                error:
                    err.message
            });

        }

    }
);


// ======================================================
// HISTORICAL EXCHANGE RATE
// ======================================================

app.get(
    '/api/history/rates/:searchTerm',
    async (req, res) => {

        try {

            const searchTerm =
                decodeURIComponent(
                    req.params.searchTerm
                ).trim();


            if (!searchTerm) {

                return res.status(400).json({
                    error:
                        'Currency or country is required'
                });

            }


            console.log(
                `Fetching historical rate for: ${searchTerm}`
            );


            // ==================================================
            // RESOLVE CURRENCY
            // ==================================================

            let currencyCode;


            // Direct currency code

            if (
                /^[A-Za-z]{3}$/.test(
                    searchTerm
                )
            ) {

                currencyCode =
                    searchTerm.toUpperCase();

            } else {

                try {

                    const details =
                        await getCountryAndCurrency(
                            searchTerm
                        );


                    if (
                        !details ||
                        !details.currencyCode
                    ) {

                        return res.status(404).json({
                            error:
                                `Could not determine currency for ${searchTerm}`
                        });

                    }


                    currencyCode =
                        details.currencyCode
                            .toUpperCase();


                    console.log(
                        `Currency resolved: ${searchTerm} -> ${currencyCode}`
                    );


                } catch (error) {

                    console.error(
                        'Currency resolution error:',
                        error.message
                    );


                    return res.status(404).json({
                        error:
                            `Could not determine currency for ${searchTerm}`,
                        details:
                            error.message
                    });

                }

            }


            console.log(
                `${searchTerm} → ${currencyCode}`
            );


            // ==================================================
            // INR
            // ==================================================

            if (
                currencyCode === 'INR'
            ) {

                return res.json([
                    {
                        date:
                            new Date()
                                .toLocaleDateString(
                                    'en-US',
                                    {
                                        month:
                                            'short',
                                        day:
                                            'numeric'
                                    }
                                ),

                        rate:
                            1,

                        currency:
                            'INR',

                        baseCurrency:
                            'INR'
                    }
                ]);

            }


            // ==================================================
            // DATE RANGE
            // ==================================================

            const today =
                new Date();


            const endDate =
                today
                    .toISOString()
                    .split('T')[0];


            const startDateObject =
                new Date(today);


            startDateObject.setDate(
                startDateObject.getDate() - 30
            );


            const startDate =
                startDateObject
                    .toISOString()
                    .split('T')[0];


            console.log(
                `Historical range: ${startDate} → ${endDate}`
            );


            // ==================================================
            // FRANKFURTER
            // ==================================================

            let response;


            try {

                response =
                    await require('axios').get(
                        'https://api.frankfurter.dev/v2/rates',
                        {
                            params: {
                                base:
                                    'INR',

                                quotes:
                                    currencyCode,

                                from:
                                    startDate
                            },

                            timeout:
                                30000
                        }
                    );


            } catch (apiError) {

                console.error(
                    'Frankfurter request failed:',
                    apiError.message
                );


                if (
                    apiError.code ===
                    'ECONNABORTED'
                ) {

                    return res.status(504).json({
                        error:
                            'Historical exchange-rate service timed out. Please try again.'
                    });

                }


                if (
                    apiError.response
                ) {

                    return res.status(
                        apiError.response.status || 502
                    ).json({
                        error:
                            'Historical exchange-rate service returned an error',

                        details:
                            apiError.response.data
                    });

                }


                return res.status(502).json({
                    error:
                        'Could not connect to historical exchange-rate service',

                    details:
                        apiError.message
                });

            }


            const rows =
                Array.isArray(
                    response.data
                )
                    ? response.data
                    : [];


            console.log(
                'Historical rows:',
                rows.length
            );


            // ==================================================
            // FORMAT DATA
            // ==================================================

            const data =
                rows

                    .filter(row =>
                        row &&
                        typeof row.rate ===
                        'number'
                    )

                    .map(row => {

                        const date =
                            new Date(
                                `${row.date}T00:00:00`
                            );


                        return {

                            date:
                                date.toLocaleDateString(
                                    'en-US',
                                    {
                                        month:
                                            'short',
                                        day:
                                            'numeric'
                                    }
                                ),

                            rate:
                                Number(
                                    row.rate.toFixed(6)
                                ),

                            currency:
                                currencyCode,

                            baseCurrency:
                                'INR'

                        };

                    });


            if (
                data.length === 0
            ) {

                return res.status(404).json({

                    error:
                        `No historical rates found for ${currencyCode}`,

                    currency:
                        currencyCode,

                    baseCurrency:
                        'INR'

                });

            }


            console.log(
                `Returning ${data.length} historical points`
            );


            res.json(data);


        } catch (error) {

            console.error(
                'Historical rate error:',
                error.response?.data ||
                error.message
            );


            res.status(500).json({

                error:
                    'Failed to fetch historical exchange rates',

                details:
                    error.message

            });

        }

    }
);


// ======================================================
// SERVER START
// ======================================================

app.listen(
    PORT,
    () => {

        console.log(
            `Server running on port ${PORT}`
        );

        startAlertWorker();

    }
);