const fs = require('fs');
const db = require('./db');
const path = require('path');

const runSchema = async () => {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        console.log('Executing schema.sql...');
        await db.query(sql);
        console.log('Database tables created successfully!');
    } catch (err) {
        if (err.code === 'ECONNREFUSED') {
            console.error('\nERROR: Cannot connect to PostgreSQL!');
            console.error('Please make sure PostgreSQL is installed and running on your machine.');
            console.error('Check your backend/.env file to ensure the DATABASE_URL is correct.\n');
        } else {
            console.error('Error executing schema:', err.message);
        }
    } finally {
        process.exit();
    }
};

runSchema();
