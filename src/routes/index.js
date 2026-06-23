'use strict';

const { Router } = require('express');

const buildAuthRouter = require('./authRoutes');
const buildUserRouter = require('./userRoutes');
const buildCategoryRouter = require('./categoryRoutes');
const buildExpenseRouter = require('./expenseRoutes');
const buildBudgetLimitRouter = require('./budgetLimitRoutes');

const buildApiRouter = ({ controllers, middlewares }) => {
    const router = Router();
    const { authenticate } = middlewares;

    router.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

    // Public auth endpoints (logout is protected inside the auth router).
    router.use('/auth', buildAuthRouter({ controllers, authenticate }));

    // Everything below requires a valid Bearer access token.
    router.use('/users', authenticate, buildUserRouter(controllers));
    router.use('/categories', authenticate, buildCategoryRouter(controllers));
    router.use('/expenses', authenticate, buildExpenseRouter(controllers));
    router.use('/budget-limits', authenticate, buildBudgetLimitRouter(controllers));

    return router;
};

module.exports = buildApiRouter;
