const db = require('./db');
const { getExchangeRate } = require('./services/exchangeRateService');

async function testAlerts() {
    try {
        const result = await db.query('SELECT a.*, u.email, u.name FROM alerts a JOIN users u ON a.user_id = u.id');
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}
testAlerts();
