'use strict';

const BaseModel = require('./BaseModel');

class BudgetLimitModel extends BaseModel {
    constructor(deps = {}) {
        super({
            tableName: 'budget_limits',
            allowedFields: ['user_id', 'category_id', 'monthly_limit', 'month', 'year'],
            ...deps,
        });
    }

    findForMonth(userId, month, year) {
        return this.findAll({
            where: { user_id: userId, month, year },
            orderBy: 'category_id',
        });
    }

    findByUserCategoryMonth(userId, categoryId, month, year) {
        return this.findOne({
            user_id: userId,
            category_id: categoryId,
            month,
            year,
        });
    }

    async upsert(payload) {
        const data = this.pickAllowed(payload);
        const sql = `
            INSERT INTO budget_limits (user_id, category_id, monthly_limit, month, year)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, category_id, month, year)
            DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit
            RETURNING *
        `;
        const result = await this.db.query(sql, [
            data.user_id,
            data.category_id,
            data.monthly_limit,
            data.month,
            data.year,
        ]);
        return result.rows[0];
    }

    async getStatusForMonth(userId, month, year) {
        const sql = `
            SELECT
                c.id AS category_id,
                c.name AS category_name,
                c.icon AS category_icon,
                c.color AS category_color,
                bl.monthly_limit,
                COALESCE(SUM(e.amount), 0)::numeric AS spent,
                CASE
                    WHEN bl.monthly_limit IS NULL OR bl.monthly_limit = 0 THEN NULL
                    ELSE ROUND((COALESCE(SUM(e.amount), 0) / bl.monthly_limit * 100)::numeric, 2)
                END AS usage_percent
            FROM categories c
            LEFT JOIN budget_limits bl
                ON bl.category_id = c.id
                AND bl.user_id = $1
                AND bl.month = $2
                AND bl.year = $3
            LEFT JOIN expenses e
                ON e.category_id = c.id
                AND e.user_id = $1
                AND EXTRACT(MONTH FROM e.expense_date) = $2
                AND EXTRACT(YEAR FROM e.expense_date) = $3
            GROUP BY c.id, c.name, c.icon, c.color, bl.monthly_limit
            ORDER BY c.name
        `;
        const result = await this.db.query(sql, [userId, month, year]);
        return result.rows;
    }
}

module.exports = BudgetLimitModel;
