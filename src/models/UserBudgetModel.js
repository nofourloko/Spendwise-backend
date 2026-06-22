'use strict';

const BaseModel = require('./BaseModel');

class UserBudgetModel extends BaseModel {
    constructor(deps = {}) {
        super({
            tableName: 'user_budgets',
            allowedFields: ['user_id', 'amount', 'month', 'year'],
            ...deps,
        });
    }

    findByUserId(userId) {
        return this.findAll({
            where: { user_id: userId },
            orderBy: 'year DESC, month DESC',
        });
    }
}

module.exports = UserBudgetModel;
