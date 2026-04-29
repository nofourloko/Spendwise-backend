'use strict';

const BaseModel = require('./BaseModel');

class CategoryModel extends BaseModel {
    constructor(deps = {}) {
        super({
            tableName: 'categories',
            allowedFields: ['name', 'icon', 'color'],
            ...deps,
        });
    }
}

module.exports = CategoryModel;
