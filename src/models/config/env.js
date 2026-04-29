'use strict';

require('dotenv').config();

const required = (name) => {
    const value = process.env[name];
    if (value === undefined || value === '') {
        throw new Error(`Brak wymaganej zmiennej srodowiskowej: ${name}`);
    }
    return value;
};

const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),

    db: {
        host: required('DB_HOST'),
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: required('DB_NAME'),
        user: required('DB_USER'),
        password: required('DB_PASSWORD'),
        max: parseInt(process.env.DB_POOL_MAX || '10', 10),
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
    },

    cors: {
        origin: process.env.CORS_ORIGIN || '*',
    },
};

env.isProduction = env.nodeEnv === 'production';
env.isDevelopment = env.nodeEnv === 'development';

module.exports = env;
