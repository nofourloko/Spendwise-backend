'use strict';

const AppError = require('../utils/AppError');

class UserService {
    constructor({ userModel, userBudgetModel }) {
        this.userModel = userModel;
        this.userBudgetModel = userBudgetModel;
    }

    list() {
        return this.userModel.findAll({ orderBy: 'created_at DESC' });
    }

    async getById(id) {
        const [user, budgets] = await Promise.all([
            this.userModel.findById(id),
            this.userBudgetModel.findByUserId(id),
        ]);
        if (!user) throw AppError.notFound('Uzytkownik nie istnieje');
        return { ...user, budgets };
    }

    async create(payload) {
        const existing = await this.userModel.findByEmail(payload.email);
        if (existing) throw AppError.conflict('Uzytkownik o tym adresie email juz istnieje');
        return this.userModel.create(payload);
    }

    async update(id, payload) {
        await this.getById(id);
        return this.userModel.update(id, payload);
    }

    async remove(id) {
        const deleted = await this.userModel.delete(id);
        if (!deleted) throw AppError.notFound('Uzytkownik nie istnieje');
        return deleted;
    }
}

module.exports = UserService;
