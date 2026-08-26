require('dotenv').config();
const axios = require('axios');

async function test() {
    const key = process.env.GEMINI_API_KEY;

    console.log('API key present:', !!key);

    try {
        console.log('Sending minimal Gemini request...');

        const response = await axios.post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent',
            {
                contents: [
                    {
                        parts: [
                            {
                                text: 'Say hello'
                            }
                        ]
                    }
                ]
            },
            {
                timeout: 60000,
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': key
                }
            }
        );

        console.log('HTTP STATUS:', response.status);

        console.log(
            'RESPONSE:',
            JSON.stringify(response.data, null, 2)
        );

    } catch (error) {

        console.error('FAILED');
        console.error('Message:', error.message);
        console.error('Code:', error.code);

        if (error.response) {
            console.error(
                'HTTP STATUS:',
                error.response.status
            );

            console.error(
                'RESPONSE:',
                JSON.stringify(
                    error.response.data,
                    null,
                    2
                )
            );
        }
    }
}

test();