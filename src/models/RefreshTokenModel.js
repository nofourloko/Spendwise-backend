'use strict';

const BaseModel = require('./BaseModel');

class RefreshTokenModel extends BaseModel {
    constructor(deps = {}) {
        super({
            tableName: 'refresh_tokens',
            allowedFields: ['user_id', 'token_hash', 'expires_at', 'revoked_at'],
            ...deps,
        });
    }

    findByHash(tokenHash, options = {}) {
        return this.findOne({ token_hash: tokenHash }, options);
    }

    // Revoke a single token by its hash. Returns the affected row (or null).
    async revokeByHash(tokenHash, { client } = {}) {
        const runner = client || this.db;
        const sql = `UPDATE ${this.tableName}
                     SET revoked_at = NOW()
                     WHERE token_hash = $1 AND revoked_at IS NULL
                     RETURNING *`;
        const result = await runner.query(sql, [tokenHash]);
        return result.rows[0] || null;
    }

    // Revoke every active token for a user (logout-everywhere).
    async revokeAllForUser(userId, { client } = {}) {
        const runner = client || this.db;
        const sql = `UPDATE ${this.tableName}
                     SET revoked_at = NOW()
                     WHERE user_id = $1 AND revoked_at IS NULL`;
        const result = await runner.query(sql, [userId]);
        return result.rowCount;
    }
}

module.exports = RefreshTokenModel;
