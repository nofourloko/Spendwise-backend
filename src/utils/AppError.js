'use strict';

class AppError extends Error {
    constructor(message, statusCode = 500, details) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace?.(this, this.constructor);
    }

    static badRequest(message = 'Nieprawidlowe zadanie', details) {
        return new AppError(message, 400, details);
    }

    static unauthorized(message = 'Brak autoryzacji.') {
        return new AppError(message, 401);
    }

    static notFound(message = 'Zasob nie istnieje') {
        return new AppError(message, 404);
    }

    static conflict(message = 'Konflikt zasobu', details) {
        return new AppError(message, 409, details);
    }

    static unprocessable(message = 'Niepoprawne dane', details) {
        return new AppError(message, 422, details);
    }
}

module.exports = AppError;
