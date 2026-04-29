'use strict';

const { Router } = require('express');

const buildUserRouter = require('./userRoutes');
const buildCategoryRouter = require('./categoryRoutes');
const buildExpenseRouter = require('./expenseRoutes');
const buildBudgetLimitRouter = require('./budgetLimitRoutes');

const buildApiRouter = (controllers) => {
    const router = Router();

    router.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

    router.use('/users', buildUserRouter(controllers));
    router.use('/categories', buildCategoryRouter(controllers));
    router.use('/expenses', buildExpenseRouter(controllers));
    router.use('/budget-limits', buildBudgetLimitRouter(controllers));

    return router;
};

module.exports = buildApiRouter;
