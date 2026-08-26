require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.GEMINI_API_KEY;

async function testGemini() {

    console.log(
        'API key present:',
        !!API_KEY
    );

    if (!API_KEY) {
        console.error(
            'GEMINI_API_KEY is missing from .env'
        );
        return;
    }

    try {

        console.log(
            'Testing actual Gemini API...'
        );

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: 'Reply with exactly: Gemini is working.'
                            }
                        ]
                    }
                ]
            },
            {
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(
            'Gemini status:',
            response.status
        );

        console.log(
            'Gemini response:'
        );

        console.log(
            JSON.stringify(
                response.data,
                null,
                2
            )
        );

    } catch (error) {

        console.error(
            '\nGemini REST test failed'
        );

        console.error(
            'Message:',
            error.message
        );

        if (error.code) {
            console.error(
                'Code:',
                error.code
            );
        }

        if (error.response) {

            console.error(
                'Status:',
                error.response.status
            );

            console.error(
                'Response:',
                JSON.stringify(
                    error.response.data,
                    null,
                    2
                )
            );
        }
    }
}

testGemini();