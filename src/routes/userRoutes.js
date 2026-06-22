'use strict';

const { Router } = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { UUID_LOOSE_REGEX } = require('../utils/validators');

const buildUserRouter = ({ userController }) => {
    const router = Router();

    const idValidators = [param('id').matches(UUID_LOOSE_REGEX).withMessage('id musi byc UUID')];

    const createValidators = [
        body('email').isEmail().withMessage('Nieprawidlowy email'),
        body('name').isString().trim().notEmpty().withMessage('Nazwa jest wymagana'),
        body('currency').optional().isString().isLength({ min: 2, max: 10 }),
    ];

    const updateValidators = [
        body('email').optional().isEmail(),
        body('name').optional().isString().trim().notEmpty(),
        body('currency').optional().isString().isLength({ min: 2, max: 10 }),
    ];

    router.get('/', asyncHandler(userController.list));
    router.get('/:id', asyncHandler(userController.getById));
    router.post('/', validate(createValidators), asyncHandler(userController.create));
    router.patch('/:id', validate([...idValidators, ...updateValidators]), asyncHandler(userController.update));
    router.delete('/:id', validate(idValidators), asyncHandler(userController.remove));

    return router;
};

module.exports = buildUserRouter;
