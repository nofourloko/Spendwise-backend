"use strict";

const env = require("./src/models/config/env");
const db = require("./src/models/config/database");
const buildApp = require("./src/app");

const start = async () => {
  try {
    await db.query("SELECT 1");
    console.log("[db] polaczono z PostgreSQL");
  } catch (err) {
    console.error("[db] nie udalo sie polaczyc z baza");
    console.error("  message:", err.message || "(brak message)");
    console.error("  code:   ", err.code);
    console.error("  host:   ", env.db.host, "port:", env.db.port);
    console.error("  user:   ", env.db.user, "db:", env.db.database);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }

  const app = buildApp();
  const server = app.listen(env.port, () => {
    console.log(
      `[http] serwer nasluchuje na porcie ${env.port} (${env.nodeEnv})`,
    );
  });

  const shutdown = async (signal) => {
    console.log(`\n[app] otrzymano sygnal ${signal}, zamykanie...`);
    server.close(async () => {
      await db.closePool();
      console.log("[app] serwer zamkniety");
      process.exit(0);
    });

    setTimeout(() => {
      console.error("[app] wymuszone zamkniecie po timeoucie");
      process.exit(1);
    }, 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    console.error("[app] unhandledRejection:", reason);
  });
  process.on("uncaughtException", (err) => {
    console.error("[app] uncaughtException:", err);
    shutdown("uncaughtException");
  });
};

start();
