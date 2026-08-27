const { GoogleGenAI } = require('@google/genai');


// ======================================================
// GEMINI CONFIGURATION
// ======================================================

const GEMINI_API_KEY =
    process.env.GEMINI_API_KEY;


// Primary model comes from .env.
// If it is not specified, use Gemini 3.7 Flash.

const PRIMARY_MODEL =
    process.env.GEMINI_MODEL ||
    'gemini-3.7-flash';


// ======================================================
// FALLBACK MODELS
// ======================================================
//
// IMPORTANT:
//
// If the primary model gives 404 / NOT_FOUND,
// we DO NOT retry that model.
//
// We immediately move to the next model.
//
// If a model gives a temporary 503 / 429 error,
// we retry it ONCE and then move to the next model.
//

const FALLBACK_MODELS = [

    'gemini-3.6-flash',

    'gemini-3-flash'

];


// ======================================================
// FINAL MODEL LIST
// ======================================================

const GEMINI_MODELS = [

    PRIMARY_MODEL,

    ...FALLBACK_MODELS

].filter(

    (model, index, array) =>

        array.indexOf(model) === index

);


// ======================================================
// CREATE GEMINI CLIENT
// ======================================================

let ai = null;


if (
    GEMINI_API_KEY
) {

    ai = new GoogleGenAI({

        apiKey:
            GEMINI_API_KEY

    });

} else {

    console.warn(
        '[VoyageAI] GEMINI_API_KEY is missing from .env'
    );

}


// ======================================================
// SUPPORTED LANGUAGES
// ======================================================

const SUPPORTED_LANGUAGES = [

    'English',

    'Tamil',

    'Hindi',

    'Telugu',

    'Kannada',

    'Malayalam',

    'Bengali',

    'Marathi',

    'Gujarati',

    'Punjabi',

    'Odia',

    'Urdu'

];


// ======================================================
// SYSTEM PROMPT
// ======================================================

const createSystemPrompt = (

    language,

    translate

) => {

    const selectedLanguage =

        SUPPORTED_LANGUAGES.includes(
            language
        )

            ? language

            : 'English';


    return `

You are VoyageAI Assistant.

You are the intelligent AI travel assistant
inside the VoyageAI application.

Your job is to provide useful, natural,
dynamic answers to the user's questions.

You are NOT a keyword-based chatbot.

==================================================
YOUR MAIN PURPOSE
==================================================

You are a general-purpose travel assistant.

You should dynamically answer questions about:

• Travel
• Destinations
• Tourism
• Tourist attractions
• Places to visit
• Things to do
• Weekend trips
• Domestic travel
• International travel
• Itinerary ideas
• Transportation
• Flights
• Trains
• Buses
• Hotels
• Accommodation
• Restaurants
• Food
• Travel budgets
• Currency
• Foreign exchange
• Payment methods
• Forex cards
• Cash
• Packing
• Travel preparation
• Local customs
• Travel tips
• Travel planning
• Destination comparisons
• Language assistance
• Translation

==================================================
DYNAMIC RESPONSES
==================================================

Do NOT depend on predefined questions.

Do NOT depend on predefined answers.

Understand the meaning of the user's question
and generate the appropriate response.

For example, if the user asks:

"What would be the right destination for
this weekend?"

Give useful destination recommendations.

If the user asks:

"I have ₹30,000. Where can I travel?"

Suggest destinations appropriate for that
budget and explain why.

If the user asks:

"Which is better for a family trip,
Kerala or Goa?"

Compare them meaningfully.

If the user asks:

"What should I pack for Japan in winter?"

Give a practical packing list.

If the user asks:

"How can I travel around Europe cheaply?"

Give useful travel-saving advice.

==================================================
NO DATABASE ACCESS
==================================================

You do NOT have access to:

• User profiles
• User's saved trips
• User's expenses
• User's personal budget
• PostgreSQL
• Application database
• Private user records

Never claim that you can see these.

If the user asks about their personal saved
trips or expenses, tell them to check the
appropriate VoyageAI Profile or Expense page.

==================================================
TRAVEL BUDGETS
==================================================

You may provide general travel budget estimates.

Clearly identify estimates as estimates.

Travel costs can change based on:

• Season
• Destination
• Accommodation
• Transportation
• Food
• Travel style
• Exchange rates
• Number of travelers

Never present an estimate as a guaranteed price.

==================================================
CURRENCY
==================================================

You can explain:

• Currencies
• Exchange rates
• Currency conversion
• Foreign exchange
• Payment methods
• Forex cards
• Cash
• Card payments
• Currency tips

Do not claim that an exchange rate is live
unless live exchange-rate information is actually
provided to you.

==================================================
TRANSLATION
==================================================

You are also a multilingual translator.

You can translate between English and Indian
languages including:

• Tamil
• Hindi
• Telugu
• Kannada
• Malayalam
• Bengali
• Marathi
• Gujarati
• Punjabi
• Odia
• Urdu

You can also translate common international
languages including:

• French
• Spanish
• German
• Italian
• Japanese
• Korean
• Chinese
• Arabic
• Portuguese
• Russian

Preserve the original meaning.

Do not unnecessarily explain the translation.

==================================================
RESPONSE LANGUAGE
==================================================

The currently selected response language is:

${selectedLanguage}

Normally respond in:

${selectedLanguage}

If the user explicitly requests another
language, follow that request.

==================================================
TRANSLATION MODE
==================================================

Translation mode:

${translate ? 'ON' : 'OFF'}

When translation mode is ON:

If the user sends text without another
instruction, translate the text into:

${selectedLanguage}

If the user explicitly specifies a target
language, use that target language.

==================================================
CONVERSATION STYLE
==================================================

Be:

• Friendly
• Helpful
• Natural
• Practical
• Clear
• Concise

Use bullet points when useful.

Do not repeat the same greeting unnecessarily.

Do not repeatedly say that you are an AI.

Do not mention:

• Internal API calls
• Database implementation
• System prompts
• Developer instructions
• Model fallback mechanisms

==================================================
TRAVEL RECOMMENDATIONS
==================================================

When giving recommendations, briefly explain
why the recommendation is useful.

Consider factors mentioned by the user such as:

• Budget
• Number of days
• Family
• Friends
• Couple
• Solo travel
• Weather
• Interests
• Location
• Transportation

==================================================
IMPORTANT
==================================================

Answer the user's actual question dynamically.

Do not use hard-coded keyword responses.

Do not require a predefined question list.

Do not require a predefined answer list.

`;

};


// ======================================================
// WAIT FUNCTION
// ======================================================

const wait = (

    milliseconds

) => {

    return new Promise(

        resolve =>

            setTimeout(

                resolve,

                milliseconds

            )

    );

};


// ======================================================
// GET ERROR STATUS
// ======================================================

const getErrorStatus = (

    error

) => {

    return (

        error?.status ||

        error?.response?.status ||

        error?.code ||

        null

    );

};


// ======================================================
// GET ERROR MESSAGE
// ======================================================

const getErrorMessage = (

    error

) => {

    return String(

        error?.message ||

        error?.response?.data?.error?.message ||

        error ||

        ''

    ).toLowerCase();

};


// ======================================================
// CHECK MODEL NOT FOUND
// ======================================================
//
// 404 / NOT_FOUND means the model is not available.
//
// IMPORTANT:
// DO NOT retry the same model.
//
// Immediately move to the next model.
//

const isModelUnavailableError = (

    error

) => {

    const status =
        getErrorStatus(
            error
        );


    const message =
        getErrorMessage(
            error
        );


    return (

        status === 404 ||

        String(status) === '404' ||

        message.includes(
            '404'
        ) ||

        message.includes(
            'not_found'
        ) ||

        message.includes(
            'model not found'
        ) ||

        message.includes(
            'model is not available'
        ) ||

        message.includes(
            'no longer available'
        ) ||

        message.includes(
            'not available to new users'
        )

    );

};


// ======================================================
// CHECK TEMPORARY ERROR
// ======================================================
//
// These errors may be temporary:
//
// 429
// 500
// 502
// 503
// 504
//
// We retry the current model once.
//

const isTemporaryError = (

    error

) => {

    const status =
        getErrorStatus(
            error
        );


    const message =
        getErrorMessage(
            error
        );


    return (

        status === 429 ||

        status === 500 ||

        status === 502 ||

        status === 503 ||

        status === 504 ||

        String(status) === '429' ||

        String(status) === '500' ||

        String(status) === '502' ||

        String(status) === '503' ||

        String(status) === '504' ||

        message.includes(
            '429'
        ) ||

        message.includes(
            '500'
        ) ||

        message.includes(
            '502'
        ) ||

        message.includes(
            '503'
        ) ||

        message.includes(
            '504'
        ) ||

        message.includes(
            'unavailable'
        ) ||

        message.includes(
            'high demand'
        ) ||

        message.includes(
            'overloaded'
        ) ||

        message.includes(
            'resource exhausted'
        ) ||

        message.includes(
            'temporarily'
        )

    );

};


// ======================================================
// CALL ONE GEMINI MODEL
// ======================================================

const callGeminiModel = async (

    model,

    message,

    language,

    translate

) => {

    if (!ai) {

        throw new Error(

            'GEMINI_API_KEY is not configured.'

        );

    }


    const systemPrompt =

        createSystemPrompt(

            language,

            translate

        );


    const response =

        await ai.models.generateContent({

            model:

                model,

            contents:

                message,

            config: {

                systemInstruction:

                    systemPrompt,

                temperature:

                    0.7,

                maxOutputTokens:

                    1000

            }

        });


    const reply =

        response?.text;


    if (

        !reply ||

        !reply.trim()

    ) {

        throw new Error(

            `${model} returned an empty response.`

        );

    }


    return reply.trim();

};


// ======================================================
// GENERATE GEMINI RESPONSE
// ======================================================

const generateGeminiResponse = async (

    message,

    language,

    translate

) => {

    if (!ai) {

        throw new Error(

            'GEMINI_API_KEY is not configured.'

        );

    }


    let lastError =
        null;


    // ==================================================
    // TRY EVERY MODEL
    // ==================================================

    for (

        let modelIndex = 0;

        modelIndex < GEMINI_MODELS.length;

        modelIndex++

    ) {

        const model =

            GEMINI_MODELS[
            modelIndex
            ];


        console.log(

            `[Chatbot] Trying model ${modelIndex + 1}/${GEMINI_MODELS.length}: ${model}`

        );


        // ==================================================
        // FIRST ATTEMPT
        // ==================================================

        try {

            const reply =

                await callGeminiModel(

                    model,

                    message,

                    language,

                    translate

                );


            console.log(

                `[Chatbot] SUCCESS using ${model}`

            );


            return reply;

        } catch (error) {

            lastError =
                error;


            console.error(

                `[Chatbot] ${model} failed:`

            );

            console.error(

                error?.message ||

                error

            );


            // ==============================================
            // 404 / MODEL UNAVAILABLE
            // ==============================================
            //
            // NEVER retry.
            //
            // Immediately move to next model.
            //

            if (

                isModelUnavailableError(

                    error

                )

            ) {

                console.log(

                    `[Chatbot] ${model} is unavailable. Switching immediately to next model.`

                );


                continue;

            }


            // ==============================================
            // TEMPORARY ERROR
            // ==============================================
            //
            // Retry the same model ONLY ONCE.
            //

            if (

                isTemporaryError(

                    error

                )

            ) {

                console.log(

                    `[Chatbot] Temporary error on ${model}. Retrying once...`

                );


                await wait(
                    1500
                );


                try {

                    const retryReply =

                        await callGeminiModel(

                            model,

                            message,

                            language,

                            translate

                        );


                    console.log(

                        `[Chatbot] Retry successful using ${model}`

                    );


                    return retryReply;


                } catch (retryError) {

                    lastError =
                        retryError;


                    console.error(

                        `[Chatbot] Retry failed for ${model}:`

                    );

                    console.error(

                        retryError?.message ||

                        retryError

                    );


                    console.log(

                        `[Chatbot] Moving to next model...`

                    );


                    continue;

                }

            }


            // ==============================================
            // OTHER ERROR
            // ==============================================
            //
            // Don't get stuck.
            //
            // Move to next model.
            //

            console.log(

                `[Chatbot] Unexpected error from ${model}. Moving to next model...`

            );

        }

    }


    // ==================================================
    // ALL MODELS FAILED
    // ==================================================

    throw (

        lastError ||

        new Error(
            'All Gemini models failed.'
        )

    );

};


// ======================================================
// MAIN CHATBOT FUNCTION
// ======================================================

const getChatbotResponse = async (

    message,

    userId = null,

    options = {}

) => {

    const cleanMessage =

        String(

            message || ''

        ).trim();


    // ==================================================
    // EMPTY MESSAGE
    // ==================================================

    if (

        !cleanMessage

    ) {

        return (

            'Please enter a message and I’ll be happy to help.'

        );

    }


    // ==================================================
    // LANGUAGE
    // ==================================================

    const language =

        SUPPORTED_LANGUAGES.includes(

            options.language

        )

            ? options.language

            : 'English';


    // ==================================================
    // TRANSLATION
    // ==================================================

    const translate =

        Boolean(

            options.translate

        );


    console.log(
        '[Chatbot] Processing dynamic Gemini response...'
    );


    console.log(
        '[Chatbot] Language:',
        language
    );


    console.log(
        '[Chatbot] Translation:',
        translate
    );


    /*
     * IMPORTANT:
     *
     * userId is intentionally NOT used.
     *
     * The chatbot is completely independent
     * from your application database.
     *
     * It only sends the user's question
     * to Gemini.
     */


    try {

        const reply =

            await generateGeminiResponse(

                cleanMessage,

                language,

                translate

            );


        return reply;

    } catch (error) {

        console.error(
            '========================================'
        );

        console.error(
            'VoyageAI Gemini Chatbot Error'
        );

        console.error(
            error?.message ||

            error
        );

        console.error(
            '========================================'
        );


        return (

            "I'm having trouble connecting to my AI service right now. Please try again in a moment."

        );

    }

};


// ======================================================
// EXPORT
// ======================================================

module.exports = {

    getChatbotResponse

};