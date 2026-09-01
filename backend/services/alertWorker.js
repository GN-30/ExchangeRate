const cron = require('node-cron');
const supabase = require('../supabase');

const {
    getExchangeRate
} = require('./exchangeRateService');

const {
    sendAlertEmail
} = require('./emailService');


// ======================================================
// ALERT WORKER
// ======================================================

const startAlertWorker = () => {

    // Run every 5 minutes
    cron.schedule(
        '*/5 * * * *',
        async () => {

            console.log(
                `[${new Date().toISOString()}] --- Running Alert Worker ---`
            );


            try {

                // ==================================================
                // GET ACTIVE ALERTS FROM SUPABASE
                // ==================================================

                const {
                    data: activeAlerts,
                    error: alertsError
                } = await supabase
                    .from('alerts')
                    .select('*')
                    .eq(
                        'is_active',
                        true
                    );


                // ==================================================
                // HANDLE ALERT FETCH ERROR
                // ==================================================

                if (alertsError) {

                    console.error(
                        '[Alert Worker] Supabase alert fetch error:',
                        alertsError
                    );

                    return;

                }


                if (
                    !activeAlerts ||
                    activeAlerts.length === 0
                ) {

                    console.log(
                        '[Alert Worker] No active alerts to check.'
                    );

                    return;

                }


                console.log(
                    `[Alert Worker] Found ${activeAlerts.length} active alert(s).`
                );


                // ==================================================
                // GET USER IDs
                // ==================================================

                const userIds = [
                    ...new Set(
                        activeAlerts
                            .map(
                                alert =>
                                    Number(
                                        alert.user_id
                                    )
                            )
                            .filter(
                                id =>
                                    !Number.isNaN(id)
                            )
                    )
                ];


                // ==================================================
                // FETCH USERS FROM SUPABASE
                // ==================================================

                const {
                    data: users,
                    error: usersError
                } = await supabase
                    .from('users')
                    .select(
                        'id, name, email'
                    )
                    .in(
                        'id',
                        userIds
                    );


                // ==================================================
                // HANDLE USER FETCH ERROR
                // ==================================================

                if (usersError) {

                    console.error(
                        '[Alert Worker] Supabase user fetch error:',
                        usersError
                    );

                    return;

                }


                // ==================================================
                // CREATE USER LOOKUP
                // ==================================================

                const userMap =
                    new Map();


                for (
                    const user of users || []
                ) {

                    userMap.set(
                        Number(user.id),
                        user
                    );

                }


                // ==================================================
                // GROUP ALERTS BY CURRENCY
                // ==================================================

                const currencies = [
                    ...new Set(
                        activeAlerts.map(
                            alert =>
                                String(
                                    alert.currency_code
                                )
                                    .trim()
                                    .toUpperCase()
                        )
                    )
                ];


                const rates = {};


                // ==================================================
                // FETCH EXCHANGE RATES
                // ==================================================

                for (
                    const currency of currencies
                ) {

                    try {

                        console.log(
                            `[Alert Worker] Fetching rate for ${currency}...`
                        );


                        rates[currency] =
                            await getExchangeRate(
                                currency
                            );


                        console.log(
                            `[Alert Worker] ${currency}: ${rates[currency]}`
                        );

                    } catch (rateError) {

                        console.error(
                            `[Alert Worker] Failed to fetch ${currency} rate:`,
                            rateError.message
                        );

                    }

                }


                // ==================================================
                // CHECK EACH ALERT
                // ==================================================

                for (
                    const alert of activeAlerts
                ) {

                    try {

                        const currency =
                            String(
                                alert.currency_code
                            )
                                .trim()
                                .toUpperCase();


                        const currentRate =
                            rates[currency];


                        // ------------------------------------------
                        // No exchange rate available
                        // ------------------------------------------

                        if (
                            currentRate === undefined ||
                            currentRate === null ||
                            Number.isNaN(
                                Number(currentRate)
                            )
                        ) {

                            console.log(
                                `[Alert Worker] No rate available for ${currency}. Skipping alert ${alert.id}.`
                            );

                            continue;

                        }


                        const targetRate =
                            parseFloat(
                                alert.target_rate
                            );


                        if (
                            Number.isNaN(
                                targetRate
                            )
                        ) {

                            console.log(
                                `[Alert Worker] Invalid target rate for alert ${alert.id}. Skipping.`
                            );

                            continue;

                        }


                        // ==================================================
                        // CHECK CONDITION
                        // ==================================================

                        let triggered = false;


                        if (
                            alert.condition === 'above' &&
                            Number(currentRate) >= targetRate
                        ) {

                            triggered = true;

                        } else if (
                            alert.condition === 'below' &&
                            Number(currentRate) <= targetRate
                        ) {

                            triggered = true;

                        }


                        if (!triggered) {

                            continue;

                        }


                        // ==================================================
                        // GET USER
                        // ==================================================

                        const user =
                            userMap.get(
                                Number(
                                    alert.user_id
                                )
                            );


                        if (!user) {

                            console.error(
                                `[Alert Worker] User ${alert.user_id} not found for alert ${alert.id}.`
                            );

                            continue;

                        }


                        if (
                            !user.email
                        ) {

                            console.error(
                                `[Alert Worker] User ${alert.user_id} has no email.`
                            );

                            continue;

                        }


                        // ==================================================
                        // ALERT TRIGGERED
                        // ==================================================

                        console.log(
                            `[ALERT] Condition met for user ${user.email}: ${currency} is ${alert.condition} ${targetRate} (current: ${currentRate})`
                        );


                        // ==================================================
                        // SEND EMAIL
                        // ==================================================

                        await sendAlertEmail(

                            user.email,

                            user.name ||
                            'User',

                            {

                                currency:
                                    currency,

                                targetRate:
                                    targetRate,

                                currentRate:
                                    currentRate,

                                condition:
                                    alert.condition

                            }

                        );


                        console.log(
                            `[ALERT] Email sent to ${user.email}`
                        );


                        // ==================================================
                        // DEACTIVATE ALERT
                        // ==================================================

                        const {
                            data: updatedAlert,
                            error: updateError
                        } = await supabase
                            .from('alerts')
                            .update({

                                is_active:
                                    false,

                                last_triggered_at:
                                    new Date().toISOString()

                            })
                            .eq(
                                'id',
                                Number(alert.id)
                            )
                            .eq(
                                'user_id',
                                Number(alert.user_id)
                            )
                            .select('*')
                            .maybeSingle();


                        if (updateError) {

                            console.error(
                                `[Alert Worker] Failed to deactivate alert ${alert.id}:`,
                                updateError
                            );

                            continue;

                        }


                        if (!updatedAlert) {

                            console.error(
                                `[Alert Worker] Alert ${alert.id} could not be updated.`
                            );

                            continue;

                        }


                        console.log(
                            `[ALERT] Alert ID ${alert.id} deactivated after sending email to ${user.email}`
                        );


                    } catch (alertError) {

                        console.error(
                            `[Alert Worker] Error processing alert ${alert.id}:`,
                            alertError
                        );

                    }

                }


            } catch (error) {

                console.error(
                    '[Alert Worker] Worker error:',
                    error
                );

            }

        }
    );


    console.log(
        'Alert worker scheduled (every 5 minutes).'
    );

};


// ======================================================
// EXPORT
// ======================================================

module.exports = {
    startAlertWorker
};