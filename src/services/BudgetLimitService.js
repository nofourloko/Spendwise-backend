'use strict';

const AppError = require('../utils/AppError');

class BudgetLimitService {
    constructor({ budgetLimitModel, userModel, categoryModel }) {
        this.budgetLimitModel = budgetLimitModel;
        this.userModel = userModel;
        this.categoryModel = categoryModel;
    }

    list(userId, month, year) {
        return this.budgetLimitModel.findForMonth(userId, month, year);
    }

    statusForMonth(userId, month, year) {
        return this.budgetLimitModel.getStatusForMonth(userId, month, year);
    }

    async upsert(payload) {
        await this.#assertUserExists(payload.user_id);
        await this.#assertCategoryExists(payload.category_id);

        if (Number(payload.monthly_limit) < 0) {
            throw AppError.unprocessable('Limit nie moze byc ujemny');
        }
        if (payload.month < 1 || payload.month > 12) {
            throw AppError.unprocessable('Miesiac musi byc w zakresie 1-12');
        }

        return this.budgetLimitModel.upsert(payload);
    }

    async remove(id) {
        const deleted = await this.budgetLimitModel.delete(id);
        if (!deleted) throw AppError.notFound('Limit budzetowy nie istnieje');
        return deleted;
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

module.exports = BudgetLimitService;
