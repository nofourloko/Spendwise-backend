'use strict';

const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
    host: env.db.host,
    port: env.db.port,
    database: env.db.database,
    user: env.db.user,
    password: env.db.password,
    max: env.db.max,
    idleTimeoutMillis: env.db.idleTimeoutMillis,
});

pool.on('error', (err) => {
    console.error('[db] nieoczekiwany blad puli polaczen:', err);
    process.exit(1);
});

const query = (text, params) => pool.query(text, params);

const withTransaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const closePool = () => pool.end();

module.exports = {
    pool,
    query,
    withTransaction,
    closePool,
};
