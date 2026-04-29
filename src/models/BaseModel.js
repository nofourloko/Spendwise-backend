"use strict";

const db = require("./config/database");

class BaseModel {
  constructor({
    tableName,
    primaryKey = "id",
    allowedFields = [],
    db: dbClient = db,
  }) {
    if (new.target === BaseModel) {
      throw new Error(
        "BaseModel jest klasa abstrakcyjna i nie moze byc instancjowana bezposrednio.",
      );
    }
    if (!tableName) {
      throw new Error("BaseModel wymaga nazwy tabeli (tableName).");
    }

    this.tableName = tableName;
    this.primaryKey = primaryKey;
    this.allowedFields = allowedFields;
    this.db = dbClient;
  }

  pickAllowed(payload) {
    if (!this.allowedFields.length) return { ...payload };
    return Object.fromEntries(
      Object.entries(payload).filter(([key]) =>
        this.allowedFields.includes(key),
      ),
    );
  }

  async findAll({ where = {}, orderBy, limit, offset, client } = {}) {
    const runner = client || this.db;
    const { clause, values } = this.#buildWhere(where);
    const orderClause = orderBy ? ` ORDER BY ${orderBy}` : "";
    const limitClause = limit ? ` LIMIT ${parseInt(limit, 10)}` : "";
    const offsetClause = offset ? ` OFFSET ${parseInt(offset, 10)}` : "";

    const sql = `SELECT * FROM ${this.tableName}${clause}${orderClause}${limitClause}${offsetClause}`;
    const result = await runner.query(sql, values);
    return result.rows;
  }

  async findById(id, { client } = {}) {
    const runner = client || this.db;
    const sql = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = $1 LIMIT 1`;
    const result = await runner.query(sql, [id]);
    return result.rows[0] || null;
  }

  async findOne(where, { client } = {}) {
    const runner = client || this.db;
    const { clause, values } = this.#buildWhere(where);
    const sql = `SELECT * FROM ${this.tableName}${clause} LIMIT 1`;
    const result = await runner.query(sql, values);
    return result.rows[0] || null;
  }

  async count(where = {}, { client } = {}) {
    const runner = client || this.db;
    const { clause, values } = this.#buildWhere(where);
    const sql = `SELECT COUNT(*)::int AS total FROM ${this.tableName}${clause}`;
    const result = await runner.query(sql, values);
    return result.rows[0].total;
  }

  async create(payload, { client } = {}) {
    const runner = client || this.db;
    const data = this.pickAllowed(payload);
    const keys = Object.keys(data);
    if (!keys.length) {
      throw new Error("Brak danych do zapisu.");
    }

    const columns = keys.join(", ");
    const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(", ");
    const values = Object.values(data);

    const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
    const result = await runner.query(sql, values);
    return result.rows[0];
  }

  async update(id, payload, { client } = {}) {
    const runner = client || this.db;
    const data = this.pickAllowed(payload);
    const keys = Object.keys(data);
    if (!keys.length) {
      return this.findById(id, { client: runner });
    }

    const setClause = keys.map((key, idx) => `${key} = $${idx + 1}`).join(", ");
    const values = [...Object.values(data), id];

    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = $${keys.length + 1} RETURNING *`;
    const result = await runner.query(sql, values);
    return result.rows[0] || null;
  }

  async delete(id, { client } = {}) {
    const runner = client || this.db;
    const sql = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = $1 RETURNING *`;
    const result = await runner.query(sql, [id]);
    return result.rows[0] || null;
  }

  #buildWhere(where) {
    const entries = Object.entries(where).filter(([, v]) => v !== undefined);
    if (!entries.length) {
      return { clause: "", values: [] };
    }
    const conditions = entries
      .map(([key], idx) => `${key} = $${idx + 1}`)
      .join(" AND ");
    return {
      clause: ` WHERE ${conditions}`,
      values: entries.map(([, value]) => value),
    };
  }
}

module.exports = BaseModel;
