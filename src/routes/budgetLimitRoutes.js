'use strict';

const { Router } = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

const buildBudgetLimitRouter = ({ budgetLimitController }) => {
    const router = Router();

    const monthYearQuery = [
        query('month').isInt({ min: 1, max: 12 }),
        query('year').isInt({ min: 2000, max: 2100 }),
    ];

    const upsertValidators = [
        body('user_id').isUUID(),
        body('category_id').isUUID(),
        body('monthly_limit').isFloat({ min: 0 }),
        body('month').isInt({ min: 1, max: 12 }),
        body('year').isInt({ min: 2000, max: 2100 }),
    ];

    router.get(
        '/users/:userId',
        validate([param('userId').isUUID(), ...monthYearQuery]),
        asyncHandler(budgetLimitController.list)
    );

    router.get(
        '/users/:userId/status',
        validate([param('userId').isUUID(), ...monthYearQuery]),
        asyncHandler(budgetLimitController.status)
    );

    router.put('/', validate(upsertValidators), asyncHandler(budgetLimitController.upsert));
    router.delete('/:id', validate([param('id').isUUID()]), asyncHandler(budgetLimitController.remove));

    return router;
};

module.exports = buildBudgetLimitRouter;
