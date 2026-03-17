const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const BASE_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/INR`;

// Mock rates for development if no API key is provided
const MOCK_RATES = {
    'USD': 0.012,
    'EUR': 0.011,
    'GBP': 0.0094,
    'JPY': 1.82,
    'AED': 0.044,
    'THB': 0.43,
    'SGD': 0.016,
};

const getExchangeRate = async (targetCurrency) => {
    if (!API_KEY || API_KEY === 'your_api_key_here') {
        return MOCK_RATES[targetCurrency] || 1.0;
    }

    try {
        const response = await axios.get(`${BASE_URL}/${targetCurrency}`);
        return response.data.conversion_rate;
    } catch (error) {
        console.error('Error fetching exchange rate:', error.message);
        return MOCK_RATES[targetCurrency] || 1.0;
    }
};

module.exports = { getExchangeRate };
