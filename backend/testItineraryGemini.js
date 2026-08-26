require('dotenv').config();
const axios = require('axios');

const key = process.env.GEMINI_API_KEY;

const prompt = `
Create a 7-day travel itinerary for Nainital, Uttarakhand, India.

Budget: 50000 INR
Travel type: budget

REAL PLACES:

1. Naini Lake | lake | 29.3919, 79.4542
2. Naina Devi Temple | temple | 29.3919, 79.4542
3. Snow View Point | viewpoint | 29.3975, 79.4636
4. Eco Cave Gardens | park | 29.3986, 79.4482
5. Tiffin Top | viewpoint | 29.3734, 79.4392

Create a practical itinerary using these real places.

Return ONLY JSON:

{
  "destination": "Nainital",
  "days": [
    {
      "day": 1,
      "title": "Day 1",
      "activities": [
        {
          "time": "09:00 AM",
          "place": "Naini Lake",
          "activity": "Visit the lake",
          "duration": "2 hours",
          "estimatedCost": 500
        }
      ]
    }
  ],
  "tips": []
}

Create exactly 7 days.
`;

async function test() {

    console.log('Prompt length:', prompt.length);
    console.log('Sending itinerary test...');

    try {

        const response = await axios.post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent',
            {
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            },
            {
                timeout: 120000,
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': key
                }
            }
        );

        console.log('HTTP STATUS:', response.status);

        const text =
            response.data
                ?.candidates?.[0]
                ?.content?.parts?.[0]
                ?.text;

        console.log('RESPONSE:');
        console.log(text);

    } catch (error) {

        console.error('FAILED:', error.message);

        if (error.response) {
            console.error(
                'STATUS:',
                error.response.status
            );

            console.error(
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