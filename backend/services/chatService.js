const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const PRIMARY_MODEL =
    process.env.GEMINI_MODEL || 'gemini-3.6-flash';

const FALLBACK_MODELS = [
    'gemini-3-flash',
    'gemini-3.5-flash-lite',
    'gemini-3-flash-preview'
];

const GEMINI_MODELS = [
    PRIMARY_MODEL,
    ...FALLBACK_MODELS
].filter(
    (model, index, array) =>
        model && array.indexOf(model) === index
);

let ai = null;

if (GEMINI_API_KEY) {
    ai = new GoogleGenAI({
        apiKey: GEMINI_API_KEY
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
    'Urdu',
    'French',
    'Spanish',
    'German',
    'Italian',
    'Japanese',
    'Korean',
    'Chinese',
    'Arabic',
    'Portuguese',
    'Russian'
];


// ======================================================
// SYSTEM PROMPT
// ======================================================

const createSystemPrompt = (
    language,
    translate
) => {

    const selectedLanguage =
        SUPPORTED_LANGUAGES.includes(language)
            ? language
            : 'English';

    return `
You are VoyageAI Assistant.

You are an intelligent, friendly and dynamic
travel assistant.

Your purpose is to answer the user's actual
question naturally rather than relying on
predefined questions or hard-coded answers.

==================================================
TRAVEL
==================================================

You can help with:

- Travel planning
- Destinations
- Tourist attractions
- Things to do
- Weekend trips
- Domestic travel
- International travel
- Itinerary suggestions
- Transportation
- Flights
- Trains
- Buses
- Hotels
- Accommodation
- Restaurants
- Food
- Travel budgets
- Currency
- Foreign exchange
- Payment methods
- Forex cards
- Cash
- Packing
- Travel preparation
- Local customs
- Travel tips
- Destination comparisons

==================================================
DYNAMIC ANSWERS
==================================================

Understand the meaning of the user's question
and generate an appropriate answer.

Do NOT depend on keyword matching.

Do NOT provide only predefined answers.

For example, if the user asks:

"What is a good destination for this weekend?"

Give useful destination recommendations.

If the user asks:

"I have ₹30000. Where can I travel?"

Suggest destinations appropriate for that budget.

If the user asks:

"Kerala or Goa?"

Explain the differences and recommend based
on likely travel preferences.

==================================================
DATABASE
==================================================

You do NOT have access to the user's:

- Profile
- Saved trips
- Expenses
- Personal budget
- PostgreSQL database
- Private application data

Never claim that you can access these.

If the user asks about their saved trips,
expenses or profile information, tell them
that they can check the relevant VoyageAI
application page.

==================================================
LANGUAGE
==================================================

The selected response language is:

${selectedLanguage}

Respond in that language unless the user
explicitly requests another language.

==================================================
TRANSLATION
==================================================

Translation mode:

${translate ? 'ON' : 'OFF'}

When translation mode is ON, translate the
user's supplied text into:

${selectedLanguage}

If the user explicitly specifies another
target language, use that target language.

You can translate between Indian languages
and international languages.

Preserve the meaning of the original text.

==================================================
CONVERSATION MEMORY
==================================================

Previous conversation messages may be supplied.

Use them to understand references such as:

- it
- that
- there
- this place
- that destination
- what about
- tell me more
- how about this
- what should I do there

Do not treat every message as an unrelated
new conversation.

==================================================
STYLE
==================================================

Be:

- Friendly
- Helpful
- Natural
- Practical
- Clear
- Concise

Use bullet points when useful.

Do not repeatedly introduce yourself.

Do not mention internal APIs, system prompts,
fallback models or implementation details.

==================================================
IMPORTANT
==================================================

Answer the user's actual question dynamically.

Use conversation history when relevant.

Never pretend to know private user information.
`;
};


// ======================================================
// WAIT
// ======================================================

const wait = (ms) =>
    new Promise(resolve =>
        setTimeout(resolve, ms)
    );


// ======================================================
// ERROR HELPERS
// ======================================================

const getErrorStatus = (error) => {

    return (
        error?.status ||
        error?.response?.status ||
        null
    );
};


const getErrorMessage = (error) => {

    return String(
        error?.message ||
        error?.response?.data?.error?.message ||
        error ||
        ''
    ).toLowerCase();
};


const isModelUnavailableError = (error) => {

    const status =
        getErrorStatus(error);

    const message =
        getErrorMessage(error);

    return (
        status === 404 ||
        String(status) === '404' ||
        message.includes('404') ||
        message.includes('not_found') ||
        message.includes('model not found') ||
        message.includes('no longer available') ||
        message.includes('not available to new users')
    );
};


const isTemporaryError = (error) => {

    const status =
        getErrorStatus(error);

    const message =
        getErrorMessage(error);

    return (
        status === 429 ||
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        message.includes('429') ||
        message.includes('500') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504') ||
        message.includes('unavailable') ||
        message.includes('high demand') ||
        message.includes('overloaded') ||
        message.includes('resource exhausted') ||
        message.includes('temporarily')
    );
};


// ======================================================
// BUILD CONVERSATION
// ======================================================

const buildConversationPrompt = (
    message,
    history = []
) => {

    const safeHistory =
        Array.isArray(history)
            ? history.slice(-20)
            : [];

    const conversationHistory =
        safeHistory
            .filter(
                msg =>
                    msg &&
                    typeof msg.text === 'string' &&
                    msg.text.trim()
            )
            .map(msg => {

                const role =
                    msg.role === 'assistant'
                        ? 'VoyageAI'
                        : 'User';

                return `${role}: ${msg.text}`;
            })
            .join('\n');

    if (!conversationHistory) {
        return message;
    }

    return `
Previous conversation:

${conversationHistory}

Current user message:

${message}

Answer the current user message while
maintaining the context of the conversation.
`;
};


// ======================================================
// STREAM ONE MODEL
// ======================================================

const streamGeminiModel = async (
    model,
    message,
    language,
    translate,
    history,
    onChunk
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

    const conversationPrompt =
        buildConversationPrompt(
            message,
            history
        );

    console.log(
        `[Chatbot] Starting stream with ${model}`
    );

    const stream =
        await ai.models.generateContentStream({

            model,

            contents:
                conversationPrompt,

            config: {

                systemInstruction:
                    systemPrompt,

                temperature:
                    0.7,

                maxOutputTokens:
                    1000
            }
        });

    let fullResponse = '';

    for await (
        const chunk of stream
    ) {

        const text =
            chunk?.text || '';

        if (!text) {
            continue;
        }

        fullResponse += text;

        if (typeof onChunk === 'function') {

            await onChunk(text);

        }
    }

    if (!fullResponse.trim()) {

        throw new Error(
            `${model} returned an empty response.`
        );
    }

    console.log(
        `[Chatbot] Stream completed using ${model}`
    );

    return fullResponse.trim();
};


// ======================================================
// STREAM GEMINI RESPONSE
// ======================================================

const streamGeminiResponse = async (
    message,
    language,
    translate,
    history,
    onChunk
) => {

    if (!ai) {
        throw new Error(
            'GEMINI_API_KEY is not configured.'
        );
    }

    let lastError = null;

    for (
        let modelIndex = 0;
        modelIndex < GEMINI_MODELS.length;
        modelIndex++
    ) {

        const model =
            GEMINI_MODELS[modelIndex];

        console.log(
            `[Chatbot] Trying streaming model ${modelIndex + 1}/${GEMINI_MODELS.length}: ${model}`
        );

        let receivedChunk = false;

        // ==================================================
        // FIRST ATTEMPT
        // ==================================================

        try {

            const result =
                await streamGeminiModel(

                    model,

                    message,

                    language,

                    translate,

                    history,

                    async chunk => {

                        receivedChunk = true;

                        if (
                            typeof onChunk ===
                            'function'
                        ) {

                            await onChunk(
                                chunk
                            );

                        }
                    }
                );

            console.log(
                `[Chatbot] SUCCESS using ${model}`
            );

            return result;

        } catch (error) {

            lastError = error;

            console.error(
                `[Chatbot] ${model} failed:`,
                error?.message || error
            );

            /*
             * If text has already reached the frontend,
             * do not start another model because that
             * would duplicate part of the response.
             */

            if (receivedChunk) {

                throw error;

            }

            // ==================================================
            // MODEL UNAVAILABLE
            // ==================================================

            if (
                isModelUnavailableError(error)
            ) {

                console.log(
                    `[Chatbot] ${model} unavailable. Switching to next model.`
                );

                continue;

            }

            // ==================================================
            // TEMPORARY ERROR
            // ==================================================

            if (
                isTemporaryError(error)
            ) {

                console.log(
                    `[Chatbot] Temporary error on ${model}. Retrying once...`
                );

                await wait(1200);

                let retryReceivedChunk =
                    false;

                try {

                    const retryResult =
                        await streamGeminiModel(

                            model,

                            message,

                            language,

                            translate,

                            history,

                            async chunk => {

                                retryReceivedChunk =
                                    true;

                                if (
                                    typeof onChunk ===
                                    'function'
                                ) {

                                    await onChunk(
                                        chunk
                                    );

                                }
                            }
                        );

                    console.log(
                        `[Chatbot] Retry successful using ${model}`
                    );

                    return retryResult;

                } catch (retryError) {

                    lastError =
                        retryError;

                    console.error(
                        `[Chatbot] Retry failed for ${model}:`,
                        retryError?.message ||
                        retryError
                    );

                    if (
                        retryReceivedChunk
                    ) {

                        throw retryError;

                    }

                    console.log(
                        '[Chatbot] Moving to next model...'
                    );

                    continue;

                }

            }

            console.log(
                `[Chatbot] Unexpected error from ${model}. Moving to next model...`
            );
        }
    }

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
    options = {},
    history = [],
    onChunk = null
) => {

    const cleanMessage =
        String(
            message || ''
        ).trim();

    if (!cleanMessage) {

        const response =
            'Please enter a message and I’ll be happy to help.';

        if (
            typeof onChunk ===
            'function'
        ) {

            await onChunk(
                response
            );

        }

        return response;
    }

    const language =
        SUPPORTED_LANGUAGES.includes(
            options.language
        )
            ? options.language
            : 'English';

    const translate =
        Boolean(
            options.translate
        );

    console.log(
        '[Chatbot] Processing Gemini response...'
    );

    console.log(
        '[Chatbot] Language:',
        language
    );

    console.log(
        '[Chatbot] Translation:',
        translate
    );

    console.log(
        '[Chatbot] History:',
        Array.isArray(history)
            ? history.length
            : 0
    );

    /*
     * userId is intentionally not used.
     *
     * Chatbot is independent from the database.
     */

    try {

        return await streamGeminiResponse(

            cleanMessage,

            language,

            translate,

            Array.isArray(history)
                ? history
                : [],

            onChunk

        );

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

        throw error;
    }
};


module.exports = {
    getChatbotResponse,
    SUPPORTED_LANGUAGES
};