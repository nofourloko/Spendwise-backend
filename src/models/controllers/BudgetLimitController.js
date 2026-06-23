'use strict';

const AppError = require('../../utils/AppError');

class BudgetLimitController {
    constructor({ budgetLimitService }) {
        this.budgetLimitService = budgetLimitService;
    }

    list = async (req, res) => {
        const { userId } = req.params;
        const month = parseInt(req.query.month, 10);
        const year = parseInt(req.query.year, 10);
        if (!month || !year) {
            throw AppError.badRequest('Wymagane parametry zapytania: month, year');
        }
        const data = await this.budgetLimitService.list(userId, month, year);
        res.json({ data });
    };

    status = async (req, res) => {
        const { userId } = req.params;
        const month = parseInt(req.query.month, 10);
        const year = parseInt(req.query.year, 10);
        if (!month || !year) {
            throw AppError.badRequest('Wymagane parametry zapytania: month, year');
        }
        const data = await this.budgetLimitService.statusForMonth(userId, month, year);
        res.json({ data });
    };

    upsert = async (req, res) => {
        const limit = await this.budgetLimitService.upsert(req.body);
        res.status(201).json({ data: limit });
    };

    remove = async (req, res) => {
        await this.budgetLimitService.remove(req.params.id);
        res.json({ data: null });
    };
}

module.exports = BudgetLimitController;
