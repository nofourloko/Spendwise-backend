'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const AppError = require('../utils/AppError');

const SESSION_EXPIRED = 'Sesja wygasla. Zaloguj sie ponownie.';

class TokenService {
    constructor({ refreshTokenModel, jwtConfig }) {
        this.refreshTokenModel = refreshTokenModel;
        this.jwt = jwtConfig;
    }

    // ---- Access token (stateless JWT) ----

    signAccessToken(user) {
        return jwt.sign(
            { sub: user.id, email: user.email },
            this.jwt.accessSecret,
            { expiresIn: this.jwt.accessTtl },
        );
    }

    // Throws on invalid/expired token — callers map this to a 401.
    verifyAccessToken(token) {
        return jwt.verify(token, this.jwt.accessSecret);
    }

    // ---- Refresh token (opaque, DB-backed, rotatable, revocable) ----

    #hash(rawToken) {
        return crypto.createHash('sha256').update(rawToken).digest('hex');
    }

    async issueRefreshToken(userId, { client } = {}) {
        const rawToken = crypto.randomUUID();
        const expiresAt = new Date(
            Date.now() + this.jwt.refreshTtlDays * 24 * 60 * 60 * 1000,
        );
        await this.refreshTokenModel.create(
            {
                user_id: userId,
                token_hash: this.#hash(rawToken),
                expires_at: expiresAt,
            },
            { client },
        );
        return rawToken;
    }

    // Validate + single-use consume. Rotation is the caller's job: it revokes
    // the presented token and issues a fresh one. Any failure -> 401.
    async consumeRefreshToken(rawToken, { client } = {}) {
        if (!rawToken || typeof rawToken !== 'string') {
            throw AppError.unauthorized(SESSION_EXPIRED);
        }

        const tokenHash = this.#hash(rawToken);
        const record = await this.refreshTokenModel.findByHash(tokenHash, { client });

        if (!record || record.revoked_at || new Date(record.expires_at) <= new Date()) {
            throw AppError.unauthorized(SESSION_EXPIRED);
        }

        await this.refreshTokenModel.revokeByHash(tokenHash, { client });
        return { userId: record.user_id };
    }

    revokeAllForUser(userId, { client } = {}) {
        return this.refreshTokenModel.revokeAllForUser(userId, { client });
    }
}

module.exports = TokenService;
