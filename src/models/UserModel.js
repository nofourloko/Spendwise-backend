'use strict';

const BaseModel = require('./BaseModel');

class UserModel extends BaseModel {
    constructor(deps = {}) {
        super({
            tableName: 'users',
            allowedFields: ['email', 'name', 'currency', 'password_hash'],
            ...deps,
        });
    }

    findByEmail(email, options = {}) {
        return this.findOne({ email }, options);
    }
}

module.exports = UserModel;
