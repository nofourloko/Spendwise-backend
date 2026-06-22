'use strict';

const { Router } = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { UUID_LOOSE_REGEX } = require('../utils/validators');

const buildExpenseRouter = ({ expenseController }) => {
    const router = Router();

    const createValidators = [
        body('user_id').matches(UUID_LOOSE_REGEX),
        body('category_id').matches(UUID_LOOSE_REGEX),
        body('amount').isFloat({ gt: 0 }).withMessage('Kwota musi byc liczba dodatnia'),
        body('description').optional().isString().isLength({ max: 255 }),
        body('expense_date').isISO8601().withMessage('expense_date musi byc data ISO 8601'),
        body('source').optional().isIn(['manual', 'ocr']),
    ];

    const updateValidators = [
        param('id').matches(UUID_LOOSE_REGEX),
        body('category_id').optional().matches(UUID_LOOSE_REGEX),
        body('amount').optional().isFloat({ gt: 0 }),
        body('description').optional().isString().isLength({ max: 255 }),
        body('expense_date').optional().isISO8601(),
        body('source').optional().isIn(['manual', 'ocr']),
    ];

    router.get(
        '/users/:userId',
        validate([
            param('userId').matches(UUID_LOOSE_REGEX),
            query('from').optional().isISO8601(),
            query('to').optional().isISO8601(),
            query('categoryId').optional().matches(UUID_LOOSE_REGEX),
            query('limit').optional().isInt({ min: 1, max: 500 }),
            query('offset').optional().isInt({ min: 0 }),
        ]),
        asyncHandler(expenseController.list)
    );

    router.get(
        '/users/:userId/summary',
        validate([
            param('userId').matches(UUID_LOOSE_REGEX),
            query('month').isInt({ min: 1, max: 12 }),
            query('year').isInt({ min: 2000, max: 2100 }),
        ]),
        asyncHandler(expenseController.summary)
    );

    router.get('/:id', validate([param('id').matches(UUID_LOOSE_REGEX)]), asyncHandler(expenseController.getById));
    router.post('/', validate(createValidators), asyncHandler(expenseController.create));
    router.patch('/:id', validate(updateValidators), asyncHandler(expenseController.update));
    router.delete('/:id', validate([param('id').matches(UUID_LOOSE_REGEX)]), asyncHandler(expenseController.remove));

    return router;
};

module.exports = buildExpenseRouter;
