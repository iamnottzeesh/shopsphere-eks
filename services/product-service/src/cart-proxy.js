const express = require("express");

function createCartProxy({
  baseUrl = process.env.CART_SERVICE_URL ||
    "http://cart-service.shopsphere.svc.cluster.local",
  timeoutMs = 5000
} = {}) {
  const base = new URL(baseUrl);
  if (!["http:", "https:"].includes(base.protocol)) {
    throw new Error("Unsupported cart-service URL protocol");
  }

  const router = express.Router();

  router.use(async (req, res) => {
    const path = req.path;
    const root = /^\/?$/.test(path);
    const cart = /^\/[0-9a-f-]{36}\/?$/i.test(path);
    const item = /^\/[0-9a-f-]{36}\/items\/p-[0-9]{1,12}\/?$/i.test(path);

    const valid = (root && req.method === "POST") ||
      (cart && req.method === "GET") ||
      (item && ["PUT", "DELETE"].includes(req.method));

    if (!valid) {
      return res.status(404).json({ error: "Cart route not found" });
    }

    const target = new URL(`/carts${root ? "" : path}`, base);
    const hasBody = ["POST", "PUT"].includes(req.method);

    try {
      const response = await fetch(target, {
        method: req.method,
        headers: {
          Accept: "application/json",
          ...(hasBody ? { "Content-Type": "application/json" } : {})
        },
        body: hasBody ? JSON.stringify(req.body ?? {}) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
        redirect: "error"
      });

      const body = await response.json();
      res.setHeader("Cache-Control", "no-store");
      return res.status(response.status).json(body);
    } catch (error) {
      const timedOut = ["TimeoutError", "AbortError"].includes(error.name);
      return res.status(timedOut ? 504 : 502).json({
        error: timedOut ? "Cart service timed out" : "Cart service unavailable"
      });
    }
  });

  return router;
}

module.exports = { createCartProxy };
