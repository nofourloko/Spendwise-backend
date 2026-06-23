'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

const buildAuthRouter = ({ controllers, authenticate }) => {
    const { authController } = controllers;
    const router = Router();

    const registerValidators = [
        body('name').isString().trim().notEmpty().withMessage('Nazwa jest wymagana'),
        body('email').isEmail().withMessage('Nieprawidlowy email'),
        body('password').isString().isLength({ min: 8 }).withMessage('Haslo musi miec min. 8 znakow'),
    ];

    const loginValidators = [
        body('email').isEmail().withMessage('Nieprawidlowy email'),
        body('password').isString().notEmpty().withMessage('Haslo jest wymagane'),
    ];

    const refreshValidators = [
        body('refreshToken').isString().notEmpty().withMessage('refreshToken jest wymagany'),
    ];

    router.post('/register', validate(registerValidators), asyncHandler(authController.register));
    router.post('/login', validate(loginValidators), asyncHandler(authController.login));
    router.post('/refresh', validate(refreshValidators), asyncHandler(authController.refresh));
    router.post('/logout', authenticate, asyncHandler(authController.logout));

    return router;
};

module.exports = buildAuthRouter;
