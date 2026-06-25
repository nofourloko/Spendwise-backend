"use strict";

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");

const env = require("./models/config/env");
const { openApiDefinition, swaggerUiOptions } = require("./models/config/swagger");
const buildContainer = require("./container");
const buildApiRouter = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const notFoundHandler = require("./middleware/notFoundHandler");

const buildApp = (overrides = {}) => {
  const container = overrides.container || buildContainer();
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: env.cors.origin }));
  app.use(compression());
  // OCR receipt scans arrive as base64-encoded photos, which are far larger
  // than ordinary JSON payloads — hence the generous limit.
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true }));

  if (!env.isProduction) {
    app.use(morgan("dev"));
  }

  app.get("/api/docs.json", (req, res) => res.json(openApiDefinition));
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDefinition, swaggerUiOptions),
  );

  app.use(
    "/api",
    buildApiRouter({
      controllers: container.controllers,
      middlewares: container.middlewares,
    }),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.locals.container = container;
  return app;
};

module.exports = buildApp;
