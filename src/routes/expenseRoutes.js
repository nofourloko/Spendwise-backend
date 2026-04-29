'use strict';

const { Router } = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

const buildExpenseRouter = ({ expenseController }) => {
    const router = Router();

    const createValidators = [
        body('user_id').isUUID(),
        body('category_id').isUUID(),
        body('amount').isFloat({ gt: 0 }).withMessage('Kwota musi byc liczba dodatnia'),
        body('description').optional().isString().isLength({ max: 255 }),
        body('expense_date').isISO8601().withMessage('expense_date musi byc data ISO 8601'),
        body('source').optional().isIn(['manual', 'ocr']),
    ];

    const updateValidators = [
        param('id').isUUID(),
        body('category_id').optional().isUUID(),
        body('amount').optional().isFloat({ gt: 0 }),
        body('description').optional().isString().isLength({ max: 255 }),
        body('expense_date').optional().isISO8601(),
        body('source').optional().isIn(['manual', 'ocr']),
    ];

    router.get(
        '/users/:userId',
        validate([
            param('userId').isUUID(),
            query('from').optional().isISO8601(),
            query('to').optional().isISO8601(),
            query('categoryId').optional().isUUID(),
            query('limit').optional().isInt({ min: 1, max: 500 }),
            query('offset').optional().isInt({ min: 0 }),
        ]),
        asyncHandler(expenseController.list)
    );

    router.get(
        '/users/:userId/summary',
        validate([
            param('userId').isUUID(),
            query('month').isInt({ min: 1, max: 12 }),
            query('year').isInt({ min: 2000, max: 2100 }),
        ]),
        asyncHandler(expenseController.summary)
    );

    router.get('/:id', validate([param('id').isUUID()]), asyncHandler(expenseController.getById));
    router.post('/', validate(createValidators), asyncHandler(expenseController.create));
    router.patch('/:id', validate(updateValidators), asyncHandler(expenseController.update));
    router.delete('/:id', validate([param('id').isUUID()]), asyncHandler(expenseController.remove));

    return router;
};

module.exports = buildExpenseRouter;
