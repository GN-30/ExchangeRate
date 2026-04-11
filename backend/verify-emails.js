const db = require('./db');

async function check() {
    try {
        const result = await db.query('SELECT a.id as alert_id, a.user_id, u.email, u.name FROM alerts a JOIN users u ON a.user_id = u.id');
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
