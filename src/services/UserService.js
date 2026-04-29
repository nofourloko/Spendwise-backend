'use strict';

const AppError = require('../utils/AppError');

class UserService {
    constructor({ userModel }) {
        this.userModel = userModel;
    }

    list() {
        return this.userModel.findAll({ orderBy: 'created_at DESC' });
    }

    async getById(id) {
        const user = await this.userModel.findById(id);
        if (!user) throw AppError.notFound('Uzytkownik nie istnieje');
        return user;
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
