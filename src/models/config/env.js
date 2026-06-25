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

    jwt: {
        // Opaque refresh tokens are random + DB-backed, so only the access
        // token needs a signing secret.
        accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
        accessTtl: process.env.JWT_ACCESS_TTL || '15m',
        refreshTtlDays: parseInt(process.env.JWT_REFRESH_TTL_DAYS || '30', 10),
    },

    anthropic: {
        // Vision model that parses receipt photos for POST /expenses/ocr/scan.
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        model: process.env.OCR_MODEL || 'claude-opus-4-8',
    },
};

env.isProduction = env.nodeEnv === 'production';
env.isDevelopment = env.nodeEnv === 'development';

if (env.isProduction && !process.env.JWT_ACCESS_SECRET) {
    throw new Error('Brak wymaganej zmiennej srodowiskowej: JWT_ACCESS_SECRET');
}

module.exports = env;
