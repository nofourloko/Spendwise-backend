"use strict";

const env = require("../models/config/env");
const AppError = require("../utils/AppError");

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        details: err.details,
      },
    });
  }

  if (
    err &&
    err.code &&
    typeof err.code === "string" &&
    err.code.startsWith("23")
  ) {
    const map = {
      23505: { status: 409, message: "Naruszenie unikalnosci" },
      23503: { status: 409, message: "Naruszenie klucza obcego" },
      23502: { status: 422, message: "Brak wymaganej wartosci (NOT NULL)" },
      23514: { status: 422, message: "Naruszenie ograniczenia CHECK" },
    };
    const mapped = map[err.code] || {
      status: 409,
      message: "Naruszenie ograniczenia bazy danych",
    };
    return res.status(mapped.status).json({
      error: {
        message: mapped.message,
        details: env.isDevelopment ? err.detail : undefined,
      },
    });
  }

  console.error("[error]", err);
  return res.status(500).json({
    error: {
      message: "Wewnetrzny blad serwera",
      details: env.isDevelopment ? err.message : undefined,
    },
  });
};

module.exports = errorHandler;
