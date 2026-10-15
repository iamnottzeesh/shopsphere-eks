const { createCartRouter } = require("./cart-routes");
const express = require("express");

function createApp(options = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));

  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      service: "shopsphere-cart-service"
    });
  });

  app.use("/carts", createCartRouter(options));

  app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  app.use((err, req, res, next) => {
    const allowed = [400, 404, 413, 502, 504];
    const status = allowed.includes(err.status) ? err.status : 500;
    const message = status === 500 ? "Internal server error"
      : status === 400 ? "Invalid request"
      : status === 413 ? "Request body too large"
      : err.message;
    res.status(status).json({ error: message });
  });

  return app;
}

module.exports = { createApp };
