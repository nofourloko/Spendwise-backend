'use strict';

const AppError = require('../utils/AppError');

class ExpenseService {
    constructor({ expenseModel, userModel, categoryModel }) {
        this.expenseModel = expenseModel;
        this.userModel = userModel;
        this.categoryModel = categoryModel;
    }

    list(userId, filters = {}) {
        return this.expenseModel.findByUser(userId, filters);
    }

    async getById(id) {
        const expense = await this.expenseModel.findById(id);
        if (!expense) throw AppError.notFound('Wydatek nie istnieje');
        return expense;
    }

    async create(payload) {
        await this.#assertUserExists(payload.user_id);
        await this.#assertCategoryExists(payload.category_id);

        if (Number(payload.amount) <= 0) {
            throw AppError.unprocessable('Kwota musi byc wieksza od zera');
        }

        return this.expenseModel.create(payload);
    }

    async update(id, payload) {
        await this.getById(id);

        if (payload.category_id) {
            await this.#assertCategoryExists(payload.category_id);
        }
        if (payload.amount !== undefined && Number(payload.amount) <= 0) {
            throw AppError.unprocessable('Kwota musi byc wieksza od zera');
        }

        return this.expenseModel.update(id, payload);
    }

    async remove(id) {
        const deleted = await this.expenseModel.delete(id);
        if (!deleted) throw AppError.notFound('Wydatek nie istnieje');
        return deleted;
    }

    summaryByCategory(userId, month, year) {
        return this.expenseModel.sumByCategory(userId, month, year);
    }

    async #assertUserExists(userId) {
        const user = await this.userModel.findById(userId);
        if (!user) throw AppError.unprocessable('Wskazany uzytkownik nie istnieje');
    }

    async #assertCategoryExists(categoryId) {
        const category = await this.categoryModel.findById(categoryId);
        if (!category) throw AppError.unprocessable('Wskazana kategoria nie istnieje');
    }
}

module.exports = ExpenseService;
