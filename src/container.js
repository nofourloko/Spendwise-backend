"use strict";

const db = require("./models/config/database");

const UserModel = require("./models/UserModel");
const UserBudgetModel = require("./models/UserBudgetModel");
const CategoryModel = require("./models/CategoryModel");
const ExpenseModel = require("./models/ExpenseModel");
const BudgetLimitModel = require("./models/BudgetLimitModel");

const UserService = require("./services/UserService");
const CategoryService = require("./services/CategoryService");
const ExpenseService = require("./services/ExpenseService");
const BudgetLimitService = require("./services/BudgetLimitService");

const UserController = require("./models/controllers/UserController");
const CategoryController = require("./models/controllers/CategoryController");
const ExpenseController = require("./models/controllers/ExpenseController");
const BudgetLimitController = require("./models/controllers/BudgetLimitController");

const buildContainer = ({ db: dbClient = db } = {}) => {
  const userModel = new UserModel({ db: dbClient });
  const userBudgetModel = new UserBudgetModel({ db: dbClient });
  const categoryModel = new CategoryModel({ db: dbClient });
  const expenseModel = new ExpenseModel({ db: dbClient });
  const budgetLimitModel = new BudgetLimitModel({ db: dbClient });

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

  const userController = new UserController({ userService });
  const categoryController = new CategoryController({ categoryService });
  const expenseController = new ExpenseController({ expenseService });
  const budgetLimitController = new BudgetLimitController({
    budgetLimitService,
  });

  return {
    db: dbClient,
    models: { userModel, userBudgetModel, categoryModel, expenseModel, budgetLimitModel },
    services: {
      userService,
      categoryService,
      expenseService,
      budgetLimitService,
    },
    controllers: {
      userController,
      categoryController,
      expenseController,
      budgetLimitController,
    },
  };
};

module.exports = buildContainer;
