'use strict';

const AppError = require('../utils/AppError');

const notFoundHandler = (req, res, next) => {
    next(AppError.notFound(`Endpoint ${req.method} ${req.originalUrl} nie istnieje`));
};

module.exports = notFoundHandler;
