const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const axios = require('axios');

dotenv.config();

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
const supabase = require('./supabase');

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
// APP
// ======================================================

const app =
    express();


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(
    express.json({
        limit: '10mb'
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: '10mb'
    })
);


const PORT =
    process.env.PORT || 5000;


// ======================================================
// HEALTH
// ======================================================

app.get(
    '/api/health',
    (req, res) => {

        res.json({
            status: 'OK',
            message: 'Server is running'
        });

    }
);


// ======================================================
// LOCATION SEARCH
// ======================================================

app.get(
    '/api/search',
    async (req, res) => {

        try {

            const query =
                String(
                    req.query.q || ''
                ).trim();

            if (
                query.length < 3
            ) {

                return res.json([]);

            }

            console.log(
                `[Search] Searching locations for: ${query}`
            );

            const results =
                await searchLocations(
                    query
                );

            res.json(
                results
            );

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

    }
);


// ======================================================
// ITINERARY
// ======================================================

const itineraryRoutes =
    require('./routes/itineraryRoutes');

app.use(
    '/api',
    itineraryRoutes
);


// ======================================================
// HISTORY
// ======================================================

app.get(
    '/api/history',
    authMiddleware,
    async (req, res) => {

        try {

            console.log(
                '[History] Fetching trips for user:',
                req.user.id
            );


            const {
                data: trips,
                error
            } = await supabase
                .from('trips')
                .select('*')
                .eq(
                    'user_id',
                    Number(req.user.id)
                )
                .order(
                    'created_at',
                    {
                        ascending: false
                    }
                )
                .limit(50);


            if (error) {

                console.error(
                    '[History] Supabase error:',
                    error
                );

                return res.status(500).json({

                    error:
                        'Failed to fetch history',

                    details:
                        error.message

                });

            }


            console.log(
                `[History] Found ${trips?.length || 0} trips`
            );


            return res.json(
                trips || []
            );

        } catch (error) {

            console.error(
                '[History] Error:',
                error
            );

            return res.status(500).json({

                error:
                    'Failed to fetch history',

                details:
                    error.message

            });

        }

    }
);


// ======================================================
// REGISTER
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

            res.json(
                result
            );

        } catch (err) {

            console.error(
                'Register error:',
                err.message
            );

            res.status(400).json({

                error:
                    err.message

            });

        }

    }
);


// ======================================================
// LOGIN
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

            res.json(
                result
            );

        } catch (err) {

            console.error(
                'Login error:',
                err.message
            );

            res.status(400).json({

                error:
                    err.message

            });

        }

    }
);


// ======================================================
// CURRENT USER
// ======================================================

app.get(
    '/api/auth/me',
    authMiddleware,
    async (req, res) => {

        try {

            console.log(
                '[Auth/Me] Fetching user:',
                req.user.id
            );


            const {
                data: user,
                error
            } = await supabase
                .from('users')
                .select(
                    'id, name, email, preferences'
                )
                .eq(
                    'id',
                    Number(req.user.id)
                )
                .maybeSingle();


            if (error) {

                console.error(
                    '[Auth/Me] Supabase error:',
                    error
                );

                return res.status(500).json({

                    error:
                        'Failed to fetch user',

                    details:
                        error.message

                });

            }


            if (!user) {

                return res.status(404).json({

                    error:
                        'User not found'

                });

            }


            return res.json(
                user
            );

        } catch (error) {

            console.error(
                '[Auth/Me] Error:',
                error
            );

            return res.status(500).json({

                error:
                    'Server error',

                details:
                    error.message

            });

        }

    }
);


// ======================================================
// CHATBOT - SSE STREAMING
// ======================================================

app.post(
    '/api/chat',
    async (req, res) => {

        let streamFinished = false;

        try {

            // ==================================================
            // TOKEN
            // ==================================================

            let userId =
                null;

            const authorization =
                req.get(
                    'Authorization'
                );

            const token =
                authorization &&
                    authorization.startsWith(
                        'Bearer '
                    )
                    ? authorization
                        .substring(7)
                        .trim()
                    : null;

            if (
                token
            ) {

                try {

                    const decoded =
                        jwt.verify(

                            token,

                            process.env.JWT_SECRET ||
                            'secret_key'

                        );

                    userId =
                        decoded.id ||
                        decoded.userId ||
                        decoded.user_id ||
                        null;

                } catch (tokenError) {

                    console.warn(
                        '[Chatbot] Invalid token. Continuing as guest.'
                    );

                }

            }


            // ==================================================
            // REQUEST
            // ==================================================

            const {
                message,
                language,
                translate,
                history
            } = req.body;


            if (
                !message ||
                typeof message !== 'string' ||
                !message.trim()
            ) {

                return res.status(400).json({

                    success:
                        false,

                    error:
                        'Please provide a valid message.'

                });

            }


            // ==================================================
            // HISTORY
            // ==================================================

            const conversationHistory =

                Array.isArray(history)

                    ? history

                        .filter(
                            item =>
                                item &&
                                typeof item.text ===
                                'string'
                        )

                        .slice(-20)

                    : [];


            // ==================================================
            // OPTIONS
            // ==================================================

            const chatbotOptions = {

                language:
                    language ||
                    'English',

                translate:
                    Boolean(
                        translate
                    )

            };


            console.log(
                '----------------------------------------'
            );

            console.log(
                '[Chatbot] New message'
            );

            console.log(
                '[Chatbot] User:',
                userId || 'Guest'
            );

            console.log(
                '[Chatbot] Language:',
                chatbotOptions.language
            );

            console.log(
                '[Chatbot] Translation:',
                chatbotOptions.translate
            );

            console.log(
                '[Chatbot] History:',
                conversationHistory.length
            );

            console.log(
                '[Chatbot] Message:',
                message.trim()
            );

            console.log(
                '----------------------------------------'
            );


            // ==================================================
            // SSE HEADERS
            // ==================================================

            res.status(200);

            res.setHeader(
                'Content-Type',
                'text/event-stream; charset=utf-8'
            );

            res.setHeader(
                'Cache-Control',
                'no-cache, no-transform'
            );

            res.setHeader(
                'Connection',
                'keep-alive'
            );

            res.setHeader(
                'X-Accel-Buffering',
                'no'
            );

            if (
                typeof res.flushHeaders ===
                'function'
            ) {

                res.flushHeaders();

            }


            // ==================================================
            // SEND EVENT
            // ==================================================

            const sendEvent = (
                event,
                data
            ) => {

                if (
                    res.writableEnded
                ) {

                    return false;

                }

                try {

                    res.write(
                        `event: ${event}\n` +
                        `data: ${JSON.stringify(data)}\n\n`
                    );

                    return true;

                } catch (error) {

                    console.error(
                        '[Chatbot] SSE write error:',
                        error.message
                    );

                    return false;

                }

            };


            // ==================================================
            // CONNECTION HANDLING
            // ==================================================

            const handleClose = () => {

                if (
                    !streamFinished
                ) {

                    console.log(
                        '[Chatbot] Client disconnected before stream completed.'
                    );

                }

            };


            res.once(
                'close',
                handleClose
            );


            // ==================================================
            // START
            // ==================================================

            sendEvent(
                'start',
                {
                    success:
                        true
                }
            );


            // ==================================================
            // GEMINI
            // ==================================================

            await getChatbotResponse(

                message.trim(),

                userId,

                chatbotOptions,

                conversationHistory,

                async chunk => {

                    if (
                        res.writableEnded
                    ) {

                        return;

                    }

                    sendEvent(
                        'chunk',
                        {
                            text:
                                chunk
                        }
                    );

                }

            );


            // ==================================================
            // DONE
            // ==================================================

            streamFinished =
                true;

            if (
                !res.writableEnded
            ) {

                sendEvent(
                    'done',
                    {
                        success:
                            true
                    }
                );

                /*
                 * Give Node a moment to flush the final
                 * SSE event before closing the response.
                 */

                setImmediate(
                    () => {

                        if (
                            !res.writableEnded
                        ) {

                            res.end();

                        }

                    }
                );

            }


        } catch (error) {

            console.error(
                '========================================'
            );

            console.error(
                '[Chatbot] Streaming error:',
                error?.message ||
                error
            );

            console.error(
                '========================================'
            );


            if (
                !res.headersSent
            ) {

                return res.status(500).json({

                    success:
                        false,

                    error:
                        'Failed to process chatbot request.'

                });

            }


            if (
                !res.writableEnded
            ) {

                try {

                    res.write(

                        `event: error\n` +

                        `data: ${JSON.stringify({

                            success:
                                false,

                            error:
                                error?.message ||
                                'Failed to generate response.'

                        })}\n\n`

                    );

                } catch (writeError) {

                    console.error(
                        '[Chatbot] Could not send error event:',
                        writeError.message
                    );

                }


                res.end();

            }

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

            // ==================================================
            // LATEST TRIP
            // ==================================================

            if (
                req.params.id === 'latest'
            ) {

                const {
                    data: trip,
                    error
                } = await supabase
                    .from('trips')
                    .select('*')
                    .eq(
                        'user_id',
                        Number(req.user.id)
                    )
                    .order(
                        'created_at',
                        {
                            ascending: false
                        }
                    )
                    .limit(1)
                    .maybeSingle();


                if (error) {

                    console.error(
                        '[Trip] Latest trip error:',
                        error
                    );

                    return res.status(500).json({

                        error:
                            'Failed to fetch latest trip',

                        details:
                            error.message

                    });

                }


                return res.json(
                    trip || null
                );

            }


            // ==================================================
            // SPECIFIC TRIP
            // ==================================================

            const {
                data: trip,
                error
            } = await supabase
                .from('trips')
                .select('*')
                .eq(
                    'id',
                    Number(req.params.id)
                )
                .eq(
                    'user_id',
                    Number(req.user.id)
                )
                .maybeSingle();


            if (error) {

                console.error(
                    '[Trip] Fetch error:',
                    error
                );

                return res.status(500).json({

                    error:
                        'Failed to fetch trip',

                    details:
                        error.message

                });

            }


            if (!trip) {

                return res.status(404).json({

                    error:
                        'Trip not found'

                });

            }


            return res.json(
                trip
            );

        } catch (error) {

            console.error(
                '[Trip] Error:',
                error
            );

            return res.status(500).json({

                error:
                    'Failed to fetch trip',

                details:
                    error.message

            });

        }

    }
);


// ======================================================
// EXPENSES GET
// ======================================================

// ======================================================
// EXPENSES GET - SUPABASE
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
                tripId === 'null' ||
                tripId === 'undefined'
            ) {

                return res.json([]);

            }


            console.log(
                '[Expenses] Fetching expenses',
                'User:',
                req.user.id,
                'Trip:',
                tripId
            );


            const {
                data: expenses,
                error
            } = await supabase
                .from('expenses')
                .select('*')
                .eq(
                    'user_id',
                    Number(req.user.id)
                )
                .eq(
                    'trip_id',
                    Number(tripId)
                )
                .order(
                    'date',
                    {
                        ascending: false
                    }
                );


            if (error) {

                console.error(
                    '[Expenses] Supabase fetch error:',
                    error
                );

                return res.status(500).json({

                    error:
                        'Failed to fetch expenses',

                    details:
                        error.message

                });

            }


            console.log(
                `[Expenses] Found ${expenses?.length || 0} expenses`
            );


            return res.json(
                expenses || []
            );

        } catch (error) {

            console.error(
                '[Expenses] Fetch error:',
                error
            );

            return res.status(500).json({

                error:
                    'Failed to fetch expenses',

                details:
                    error.message

            });

        }

    }
);


// ======================================================
// EXPENSE CREATE
// ======================================================

// ======================================================
// EXPENSE CREATE - SUPABASE
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


            // ==================================================
            // VALIDATION
            // ==================================================

            if (
                !trip_id
            ) {

                return res.status(400).json({

                    error:
                        'trip_id is required'

                });

            }


            if (
                !category
            ) {

                return res.status(400).json({

                    error:
                        'category is required'

                });

            }


            if (
                amount_inr === undefined ||
                amount_inr === null ||
                Number(amount_inr) < 0
            ) {

                return res.status(400).json({

                    error:
                        'Valid amount_inr is required'

                });

            }


            if (
                amount_local === undefined ||
                amount_local === null ||
                Number(amount_local) < 0
            ) {

                return res.status(400).json({

                    error:
                        'Valid amount_local is required'

                });

            }


            if (
                !date
            ) {

                return res.status(400).json({

                    error:
                        'date is required'

                });

            }


            // ==================================================
            // VERIFY TRIP BELONGS TO USER
            // ==================================================

            const {
                data: trip,
                error: tripError
            } = await supabase
                .from('trips')
                .select('id')
                .eq(
                    'id',
                    Number(trip_id)
                )
                .eq(
                    'user_id',
                    Number(req.user.id)
                )
                .maybeSingle();


            if (tripError) {

                console.error(
                    '[Expenses] Trip verification error:',
                    tripError
                );

                return res.status(500).json({

                    error:
                        'Failed to verify trip',

                    details:
                        tripError.message

                });

            }


            if (!trip) {

                return res.status(404).json({

                    error:
                        'Trip not found or does not belong to this user'

                });

            }


            // ==================================================
            // INSERT EXPENSE
            // ==================================================

            console.log(
                '[Expenses] Saving expense to Supabase...'
            );


            const {
                data: expense,
                error
            } = await supabase
                .from('expenses')
                .insert({

                    trip_id:
                        Number(trip_id),

                    user_id:
                        Number(req.user.id),

                    category:
                        category,

                    amount_inr:
                        Number(amount_inr),

                    amount_local:
                        Number(amount_local),

                    description:
                        description ||
                        null,

                    date:
                        date

                })
                .select('*')
                .single();


            if (error) {

                console.error(
                    '[Expenses] Supabase insert error:',
                    error
                );

                return res.status(500).json({

                    error:
                        'Failed to save expense',

                    details:
                        error.message

                });

            }


            console.log(
                '[Expenses] Expense saved successfully.'
            );


            console.log(
                '[Expenses] Expense ID:',
                expense.id
            );


            return res.status(201).json(
                expense
            );


        } catch (error) {

            console.error(
                '[Expenses] Create error:',
                error
            );

            return res.status(500).json({

                error:
                    'Failed to create expense',

                details:
                    error.message

            });

        }

    }
);


// ======================================================
// EXPENSE DELETE
// ======================================================

// ======================================================
// EXPENSE DELETE - SUPABASE
// ======================================================

app.delete(
    '/api/expenses/:id',
    authMiddleware,
    async (req, res) => {

        try {

            const expenseId =
                Number(req.params.id);


            if (
                !expenseId ||
                Number.isNaN(expenseId)
            ) {

                return res.status(400).json({

                    error:
                        'Invalid expense ID'

                });

            }


            console.log(
                '[Expenses] Deleting expense:',
                expenseId,
                'User:',
                req.user.id
            );


            const {
                data: deletedExpense,
                error
            } = await supabase
                .from('expenses')
                .delete()
                .eq(
                    'id',
                    expenseId
                )
                .eq(
                    'user_id',
                    Number(req.user.id)
                )
                .select('*')
                .maybeSingle();


            if (error) {

                console.error(
                    '[Expenses] Supabase delete error:',
                    error
                );

                return res.status(500).json({

                    error:
                        'Failed to delete expense',

                    details:
                        error.message

                });

            }


            if (!deletedExpense) {

                return res.status(404).json({

                    error:
                        'Expense not found'

                });

            }


            console.log(
                '[Expenses] Expense deleted successfully:',
                deletedExpense.id
            );


            return res.json({

                success:
                    true,

                expense:
                    deletedExpense

            });

        } catch (error) {

            console.error(
                '[Expenses] Delete error:',
                error
            );

            return res.status(500).json({

                error:
                    'Failed to delete expense',

                details:
                    error.message

            });

        }

    }
);

// ======================================================
// ALERT CREATE
// ======================================================

// ======================================================
// CREATE ALERT - SUPABASE
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


            // ==================================================
            // VALIDATION
            // ==================================================

            if (
                !currency_code ||
                typeof currency_code !== 'string'
            ) {

                return res.status(400).json({

                    error:
                        'currency_code is required'

                });

            }


            if (
                target_rate === undefined ||
                target_rate === null ||
                Number(target_rate) <= 0
            ) {

                return res.status(400).json({

                    error:
                        'Valid target_rate is required'

                });

            }


            if (
                condition !== 'above' &&
                condition !== 'below'
            ) {

                return res.status(400).json({

                    error:
                        "condition must be either 'above' or 'below'"

                });

            }


            // ==================================================
            // SAVE ALERT TO SUPABASE
            // ==================================================

            console.log(
                '[Alerts] Creating alert for user:',
                req.user.id
            );


            const {
                data: alert,
                error
            } = await supabase
                .from('alerts')
                .insert({

                    user_id:
                        Number(req.user.id),

                    currency_code:
                        currency_code
                            .trim()
                            .toUpperCase(),

                    target_rate:
                        Number(target_rate),

                    condition:
                        condition,

                    is_active:
                        true

                })
                .select('*')
                .single();


            // ==================================================
            // SUPABASE ERROR
            // ==================================================

            if (error) {

                console.error(
                    '[Alerts] Supabase insert error:',
                    error
                );

                return res.status(500).json({

                    error:
                        'Failed to create alert',

                    details:
                        error.message

                });

            }


            // ==================================================
            // SUCCESS
            // ==================================================

            console.log(
                '[Alerts] Alert created successfully.'
            );

            console.log(
                '[Alerts] Alert ID:',
                alert.id
            );


            return res.status(201).json(
                alert
            );


        } catch (err) {

            console.error(
                '[Alerts] Alert creation error:',
                err
            );

            return res.status(500).json({

                error:
                    'Failed to create alert',

                details:
                    err.message

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
                require(
                    './services/emailService'
                );


            await sendAlertEmail(

                req.user.email,

                req.user.name ||
                'User',

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
// HISTORICAL RATES
// ======================================================

app.get(
    '/api/history/rates/:searchTerm',
    async (req, res) => {

        try {

            const searchTerm =
                decodeURIComponent(
                    req.params.searchTerm
                ).trim();


            if (
                !searchTerm
            ) {

                return res.status(400).json({

                    error:
                        'Currency or country is required'

                });

            }


            let currencyCode;


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


            let response;


            try {

                response =
                    await axios.get(

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

                        apiError.response.status ||
                        502

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


            const data =
                rows

                    .filter(
                        row =>
                            row &&
                            typeof row.rate ===
                            'number'
                    )

                    .map(
                        row => {

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
                                        row.rate.toFixed(
                                            6
                                        )
                                    ),

                                currency:
                                    currencyCode,

                                baseCurrency:
                                    'INR'

                            };

                        }
                    );


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


            res.json(
                data
            );

        } catch (error) {

            console.error(
                'Historical rate error:',
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
// 404
// ======================================================

app.use(
    (req, res) => {

        res.status(404).json({

            success:
                false,

            error:
                'API endpoint not found.'

        });

    }
);


// ======================================================
// GLOBAL ERROR
// ======================================================

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            'Global server error:',
            error
        );


        if (
            res.headersSent
        ) {

            return next(
                error
            );

        }


        res.status(500).json({

            success:
                false,

            error:
                'Internal server error.'

        });

    }
);


// ======================================================
// START
// ======================================================

app.listen(
    PORT,
    () => {

        console.log(
            '========================================'
        );

        console.log(
            '        VoyageAI Backend Server'
        );

        console.log(
            '========================================'
        );

        console.log(
            `Server running on port ${PORT}`
        );

        console.log(
            'Chatbot endpoint: POST /api/chat'
        );

        console.log(
            `AI model: ${process.env.GEMINI_MODEL ||
            'gemini-3.6-flash'
            }`
        );

        console.log(
            '========================================'
        );

        startAlertWorker();

    }
);