"use strict";

const db = require("./models/config/database");
const env = require("./models/config/env");

const UserModel = require("./models/UserModel");
const UserBudgetModel = require("./models/UserBudgetModel");
const CategoryModel = require("./models/CategoryModel");
const ExpenseModel = require("./models/ExpenseModel");
const BudgetLimitModel = require("./models/BudgetLimitModel");
const RefreshTokenModel = require("./models/RefreshTokenModel");

const UserService = require("./services/UserService");
const CategoryService = require("./services/CategoryService");
const ExpenseService = require("./services/ExpenseService");
const BudgetLimitService = require("./services/BudgetLimitService");
const OcrService = require("./services/OcrService");
const TokenService = require("./services/TokenService");
const AuthService = require("./services/AuthService");

const UserController = require("./models/controllers/UserController");
const CategoryController = require("./models/controllers/CategoryController");
const ExpenseController = require("./models/controllers/ExpenseController");
const BudgetLimitController = require("./models/controllers/BudgetLimitController");
const OcrController = require("./models/controllers/OcrController");
const AuthController = require("./models/controllers/AuthController");

const buildAuthenticate = require("./middleware/authenticate");

const buildContainer = ({ db: dbClient = db } = {}) => {
  const userModel = new UserModel({ db: dbClient });
  const userBudgetModel = new UserBudgetModel({ db: dbClient });
  const categoryModel = new CategoryModel({ db: dbClient });
  const expenseModel = new ExpenseModel({ db: dbClient });
  const budgetLimitModel = new BudgetLimitModel({ db: dbClient });
  const refreshTokenModel = new RefreshTokenModel({ db: dbClient });

  const userService = new UserService({ userModel, userBudgetModel });
  const categoryService = new CategoryService({ categoryModel });
  const expenseService = new ExpenseService({
    expenseModel,
    userModel,
    categoryModel,
  });
  const budgetLimitService = new BudgetLimitService({
    budgetLimitModel,
    userModel,
    categoryModel,
  });
  const ocrService = new OcrService({
    categoryModel,
    anthropicConfig: env.anthropic,
  });
  const tokenService = new TokenService({ refreshTokenModel, jwtConfig: env.jwt });
  const authService = new AuthService({ userModel, tokenService });

  const userController = new UserController({ userService });
  const categoryController = new CategoryController({ categoryService });
  const expenseController = new ExpenseController({ expenseService });
  const budgetLimitController = new BudgetLimitController({
    budgetLimitService,
  });
  const ocrController = new OcrController({ ocrService });
  const authController = new AuthController({ authService });

  const authenticate = buildAuthenticate({ tokenService });

  return {
    db: dbClient,
    models: {
      userModel,
      userBudgetModel,
      categoryModel,
      expenseModel,
      budgetLimitModel,
      refreshTokenModel,
    },
    services: {
      userService,
      categoryService,
      expenseService,
      budgetLimitService,
      ocrService,
      tokenService,
      authService,
    },
    controllers: {
      userController,
      categoryController,
      expenseController,
      budgetLimitController,
      ocrController,
      authController,
    },
    middlewares: { authenticate },
  };
};

module.exports = buildContainer;
