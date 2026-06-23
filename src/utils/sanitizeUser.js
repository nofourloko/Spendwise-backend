'use strict';

// Strips secret columns (password_hash) before a user row leaves the API.
// BaseModel does `SELECT *`, so this guard must wrap every user we return.
const sanitizeUser = (user) => {
    if (!user) return user;
    const { password_hash, ...safe } = user;
    return safe;
};

module.exports = sanitizeUser;
