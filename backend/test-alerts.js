const db = require('./db');
const { getExchangeRate } = require('./services/exchangeRateService');
const { sendAlertEmail } = require('./services/emailService');

async function testAlerts() {
    console.log('--- Testing Alert Logic ---');
    try {
        const result = await db.query(`
            SELECT a.*, u.email, u.name 
            FROM alerts a 
            JOIN users u ON a.user_id = u.id 
            WHERE a.is_active = TRUE
        `);
        
        const activeAlerts = result.rows;
        console.log(`Found ${activeAlerts.length} active alerts.`);

        for (const alert of activeAlerts) {
            console.log(`Checking alert for User: ${alert.name} (${alert.email}), Currency: ${alert.currency_code}`);
            const currentRate = await getExchangeRate(alert.currency_code);
            console.log(`Current Rate: ${currentRate}, Target: ${alert.target_rate} (${alert.condition})`);

            const targetRate = parseFloat(alert.target_rate);
            let triggered = false;
            if (alert.condition === 'above' && currentRate >= targetRate) triggered = true;
            else if (alert.condition === 'below' && currentRate <= targetRate) triggered = true;

            if (triggered) {
                console.log(`!!! ALERT TRIGGERED for ${alert.email} !!!`);
                // Note: Not actually calling sendAlertEmail here unless we want to test that too
                // await sendAlertEmail(alert.email, alert.name, { ... });
            } else {
                console.log(`Condition not met.`);
            }
        }
    } catch (error) {
        console.error('Test error:', error.message);
    } finally {
        process.exit();
    }
}

testAlerts();
