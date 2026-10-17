import express from "express";
import {
  createOrder,
  getOrder,
  updateOrderStatus
} from "./orderStore.js";
import { connectRedis, redis } from "./redis.js";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "order-service"
  });
});

app.get("/ready", async (_req, res) => {
  try {
    await connectRedis();
    await redis.ping();

    res.status(200).json({
      status: "ready",
      service: "order-service"
    });
  } catch {
    res.status(503).json({
      status: "not_ready",
      service: "order-service"
    });
  }
});

app.post("/orders", async (req, res) => {
  const { customerId, items } = req.body ?? {};

  if (typeof customerId !== "string" || customerId.trim() === "") {
    return res.status(400).json({ error: "customerId is required" });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: "items must be a non-empty array"
    });
  }

  const invalidItem = items.some((item) => {
    return (
      !item ||
      typeof item.productId !== "string" ||
      item.productId.trim() === "" ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    );
  });

  if (invalidItem) {
    return res.status(400).json({
      error: "each item requires a productId and a positive integer quantity"
    });
  }

  await connectRedis();

  const order = await createOrder({ customerId, items });
  return res.status(201).json(order);
});

app.get("/orders/:id", async (req, res) => {
  await connectRedis();

  const order = await getOrder(req.params.id);

  if (!order) {
    return res.status(404).json({ error: "order not found" });
  }

  return res.status(200).json(order);
});

app.patch("/orders/:id/status", async (req, res) => {
  const { status } = req.body ?? {};

  if (typeof status !== "string" || status.trim() === "") {
    return res.status(400).json({ error: "status is required" });
  }

  await connectRedis();

  const result = await updateOrderStatus(req.params.id, status);

  if (result.error === "not_found") {
    return res.status(404).json({ error: "order not found" });
  }

  if (result.error === "invalid_transition") {
    return res.status(409).json({
      error: `cannot transition from ${result.currentStatus} to ${status}`
    });
  }

  return res.status(200).json(result.order);
});

export default app;
