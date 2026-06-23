'use strict';

const AppError = require('../utils/AppError');

// Factory: needs the TokenService to verify access tokens.
// Missing / malformed / invalid / EXPIRED access token -> 401 (never 403);
// 401 is what triggers the client's silent refresh + re-login flow.
const buildAuthenticate = ({ tokenService }) => (req, res, next) => {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return next(AppError.unauthorized());
    }

    try {
        const payload = tokenService.verifyAccessToken(token);
        req.user = { id: payload.sub, email: payload.email };
        return next();
    } catch (err) {
        return next(AppError.unauthorized());
    }
};

module.exports = buildAuthenticate;
