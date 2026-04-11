const db = require('./db');

async function migrate() {
    try {
        console.log('Adding last_triggered_at to alerts table...');
        await db.query('ALTER TABLE alerts ADD COLUMN IF NOT EXISTS last_triggered_at TIMESTAMP;');
        console.log('Migration successful!');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        process.exit();
    }
}

migrate();
