'use strict';

const AppError = require('../utils/AppError');

class CategoryService {
    constructor({ categoryModel }) {
        this.categoryModel = categoryModel;
    }

    list() {
        return this.categoryModel.findAll({ orderBy: 'name' });
    }

    async getById(id) {
        const category = await this.categoryModel.findById(id);
        if (!category) throw AppError.notFound('Kategoria nie istnieje');
        return category;
    }
}

module.exports = CategoryService;
