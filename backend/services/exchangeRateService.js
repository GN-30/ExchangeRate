const axios = require('axios');
require('dotenv').config();

const getExchangeRate = async (targetCurrency) => {
    try {
        // Use a completely free, no-key-required global exchange rate API!
        const response = await axios.get(`https://open.er-api.com/v6/latest/INR`);
        const rates = response.data.rates;
        
        if (rates && rates[targetCurrency]) {
            return rates[targetCurrency];
        }
        
        console.warn(`Currency ${targetCurrency} not found in open API fallback, defaulting to 1`);
        return 1.0;
    } catch (error) {
        console.error('Error fetching global exchange rate:', error.message);
        return 1.0;
    }
};

module.exports = { getExchangeRate };
