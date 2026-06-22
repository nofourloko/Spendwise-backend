'use strict';

const fs = require('fs');
const path = require('path');
const { query, closePool } = require('../src/models/config/database');

const ROOT = path.resolve(__dirname, '..');
const SEED_FILE = path.join(ROOT, 'src', 'db', 'seed.sql');

const log = (msg) => console.log(`[seed] ${msg}`);

const main = async () => {
    log('odczyt pliku seed.sql...');
    const sql = fs.readFileSync(SEED_FILE, 'utf8');

    log('uruchamianie seed.sql (schemat + wipe + dane)...');
    await query(sql);

    const [users, categories, expenses, budgets, userBudgets] = await Promise.all([
        query('SELECT COUNT(*)::int AS cnt FROM users'),
        query('SELECT COUNT(*)::int AS cnt FROM categories'),
        query('SELECT COUNT(*)::int AS cnt FROM expenses'),
        query('SELECT COUNT(*)::int AS cnt FROM budget_limits'),
        query('SELECT COUNT(*)::int AS cnt FROM user_budgets'),
    ]);

    log('podsumowanie:');
    log(`  users:         ${users.rows[0].cnt}`);
    log(`  categories:    ${categories.rows[0].cnt}`);
    log(`  expenses:      ${expenses.rows[0].cnt}`);
    log(`  budget_limits: ${budgets.rows[0].cnt}`);
    log(`  user_budgets:  ${userBudgets.rows[0].cnt}`);
    log('gotowe');
};

main()
    .catch((err) => {
        console.error('[seed] blad:', err.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await closePool();
    });
