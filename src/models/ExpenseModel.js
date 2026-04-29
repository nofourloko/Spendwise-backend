'use strict';

const BaseModel = require('./BaseModel');

class ExpenseModel extends BaseModel {
    constructor(deps = {}) {
        super({
            tableName: 'expenses',
            allowedFields: ['user_id', 'category_id', 'amount', 'description', 'expense_date', 'source'],
            ...deps,
        });
    }

    async findByUser(userId, { from, to, categoryId, limit, offset } = {}) {
        const conditions = ['e.user_id = $1'];
        const values = [userId];
        let idx = 2;

        if (from) {
            conditions.push(`e.expense_date >= $${idx++}`);
            values.push(from);
        }
        if (to) {
            conditions.push(`e.expense_date <= $${idx++}`);
            values.push(to);
        }
        if (categoryId) {
            conditions.push(`e.category_id = $${idx++}`);
            values.push(categoryId);
        }

        let sql = `
            SELECT e.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
            FROM expenses e
            JOIN categories c ON c.id = e.category_id
            WHERE ${conditions.join(' AND ')}
            ORDER BY e.expense_date DESC, e.created_at DESC
        `;
        if (limit) sql += ` LIMIT ${parseInt(limit, 10)}`;
        if (offset) sql += ` OFFSET ${parseInt(offset, 10)}`;

        const result = await this.db.query(sql, values);
        return result.rows;
    }

    async sumByCategory(userId, month, year) {
        const sql = `
            SELECT
                c.id AS category_id,
                c.name AS category_name,
                c.icon AS category_icon,
                c.color AS category_color,
                COALESCE(SUM(e.amount), 0)::numeric AS total
            FROM categories c
            LEFT JOIN expenses e
                ON e.category_id = c.id
                AND e.user_id = $1
                AND EXTRACT(MONTH FROM e.expense_date) = $2
                AND EXTRACT(YEAR FROM e.expense_date) = $3
            GROUP BY c.id, c.name, c.icon, c.color
            ORDER BY total DESC
        `;
        const result = await this.db.query(sql, [userId, month, year]);
        return result.rows;
    }
}

module.exports = ExpenseModel;
