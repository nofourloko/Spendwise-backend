'use strict';

const AppError = require('../../utils/AppError');

class ExpenseController {
    constructor({ expenseService }) {
        this.expenseService = expenseService;
    }

    list = async (req, res) => {
        const { userId } = req.params;
        const { from, to, categoryId, limit, offset } = req.query;
        const expenses = await this.expenseService.list(userId, { from, to, categoryId, limit, offset });
        res.json({ data: expenses });
    };

    getById = async (req, res) => {
        const expense = await this.expenseService.getById(req.params.id);
        res.json({ data: expense });
    };

    create = async (req, res) => {
        const expense = await this.expenseService.create(req.body);
        res.status(201).json({ data: expense });
    };

    update = async (req, res) => {
        const expense = await this.expenseService.update(req.params.id, req.body);
        res.json({ data: expense });
    };

    remove = async (req, res) => {
        await this.expenseService.remove(req.params.id);
        res.json({ data: null });
    };

    summary = async (req, res) => {
        const { userId } = req.params;
        const month = parseInt(req.query.month, 10);
        const year = parseInt(req.query.year, 10);
        if (!month || !year) {
            throw AppError.badRequest('Wymagane parametry zapytania: month, year');
        }
        const data = await this.expenseService.summaryByCategory(userId, month, year);
        res.json({ data });
    };
}

module.exports = ExpenseController;
