const cron = require('node-cron');
const db = require('../db');
const { getExchangeRate } = require('./exchangeRateService');
const { sendAlertEmail } = require('./emailService');

const startAlertWorker = () => {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        console.log(`[${new Date().toISOString()}] --- Running Alert Worker ---`);
        
        try {
            // Get all active alerts with the user's own email and name via JOIN
            const result = await db.query(`
                SELECT a.*, u.email, u.name 
                FROM alerts a 
                JOIN users u ON a.user_id = u.id 
                WHERE a.is_active = TRUE
            `);
            
            const activeAlerts = result.rows;
            if (activeAlerts.length === 0) {
                console.log('No active alerts to check.');
                return;
            }

            // Group by currency to minimize API calls
            const currencies = [...new Set(activeAlerts.map(a => a.currency_code))];
            const rates = {};

            for (const currency of currencies) {
                rates[currency] = await getExchangeRate(currency);
            }

            for (const alert of activeAlerts) {
                const currentRate = rates[alert.currency_code];
                const targetRate = parseFloat(alert.target_rate);
                let triggered = false;

                if (alert.condition === 'above' && currentRate >= targetRate) {
                    triggered = true;
                } else if (alert.condition === 'below' && currentRate <= targetRate) {
                    triggered = true;
                }

                if (triggered) {
                    console.log(`[ALERT] Condition met for user ${alert.email}: ${alert.currency_code} is ${alert.condition} ${targetRate} (current: ${currentRate})`);
                    
                    // Send email to the user who created this alert (their own email from the users table)
                    await sendAlertEmail(alert.email, alert.name, {
                        currency: alert.currency_code,
                        targetRate: targetRate,
                        currentRate: currentRate,
                        condition: alert.condition
                    });

                    // Deactivate the alert so it only fires ONCE
                    await db.query(
                        'UPDATE alerts SET is_active = FALSE, last_triggered_at = CURRENT_TIMESTAMP WHERE id = $1',
                        [alert.id]
                    );

                    console.log(`[ALERT] Alert ID ${alert.id} deactivated after sending email to ${alert.email}`);
                }
            }
        } catch (error) {
            console.error('Alert worker error:', error.message);
        }
    });

    console.log('Alert worker scheduled (every 5 minutes).');
};

module.exports = { startAlertWorker };
