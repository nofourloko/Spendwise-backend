'use strict';

const AppError = require('../utils/AppError');
const sanitizeUser = require('../utils/sanitizeUser');

class UserService {
    constructor({ userModel, userBudgetModel }) {
        this.userModel = userModel;
        this.userBudgetModel = userBudgetModel;
    }

    async list() {
        const users = await this.userModel.findAll({ orderBy: 'created_at DESC' });
        return users.map(sanitizeUser);
    }

    async getById(id) {
        const [user, budgets] = await Promise.all([
            this.userModel.findById(id),
            this.userBudgetModel.findByUserId(id),
        ]);
        if (!user) throw AppError.notFound('Uzytkownik nie istnieje');
        return { ...sanitizeUser(user), budgets };
    }

    async create(payload) {
        const existing = await this.userModel.findByEmail(payload.email);
        if (existing) throw AppError.conflict('Uzytkownik o tym adresie email juz istnieje');
        const user = await this.userModel.create(payload);
        return sanitizeUser(user);
    }

    async update(id, payload) {
        await this.getById(id);
        const user = await this.userModel.update(id, payload);
        return sanitizeUser(user);
    }

    async remove(id) {
        const deleted = await this.userModel.delete(id);
        if (!deleted) throw AppError.notFound('Uzytkownik nie istnieje');
        return sanitizeUser(deleted);
    }
}

module.exports = UserService;
