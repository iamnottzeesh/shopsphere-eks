import assert from "node:assert/strict";
import { after, beforeEach, describe, it } from "node:test";
import request from "supertest";
import app from "../src/app.js";
import { connectRedis, closeRedis, redis } from "../src/redis.js";
import { resetOrders } from "../src/orderStore.js";

describe("order API", () => {
  beforeEach(async () => {
    await connectRedis();
    await resetOrders();
  });

  after(async () => {
    await resetOrders();
    await closeRedis();
  });

  it("creates and retrieves an order", async () => {
    const created = await request(app)
      .post("/orders")
      .send({
        customerId: "customer-1",
        items: [{ productId: "product-1", quantity: 2 }]
      });

    assert.equal(created.status, 201);
    assert.equal(created.body.status, "created");

    const retrieved = await request(app).get(`/orders/${created.body.id}`);

    assert.equal(retrieved.status, 200);
    assert.equal(retrieved.body.id, created.body.id);
    assert.equal(retrieved.body.customerId, "customer-1");
  });

  it("rejects an order without items", async () => {
    const response = await request(app)
      .post("/orders")
      .send({ customerId: "customer-1", items: [] });

    assert.equal(response.status, 400);
  });

  it("rejects an order with an invalid item", async () => {
    const response = await request(app)
      .post("/orders")
      .send({
        customerId: "customer-1",
        items: [{ productId: "product-1", quantity: 0 }]
      });

    assert.equal(response.status, 400);
  });

  it("returns 404 for an unknown order", async () => {
    const response = await request(app).get("/orders/does-not-exist");

    assert.equal(response.status, 404);
  });

  it("transitions a created order to paid", async () => {
    const created = await request(app)
      .post("/orders")
      .send({
        customerId: "customer-1",
        items: [{ productId: "product-1", quantity: 1 }]
      });

    const response = await request(app)
      .patch(`/orders/${created.body.id}/status`)
      .send({ status: "paid" });

    assert.equal(response.status, 200);
    assert.equal(response.body.status, "paid");
  });

  it("rejects an invalid status transition", async () => {
    const created = await request(app)
      .post("/orders")
      .send({
        customerId: "customer-1",
        items: [{ productId: "product-1", quantity: 1 }]
      });

    const response = await request(app)
      .patch(`/orders/${created.body.id}/status`)
      .send({ status: "delivered" });

    assert.equal(response.status, 409);
  });

  it("returns 404 when updating an unknown order status", async () => {
    const response = await request(app)
      .patch("/orders/does-not-exist/status")
      .send({ status: "paid" });

    assert.equal(response.status, 404);
  });

  it("persists an order across a new Redis lookup", async () => {
    const created = await request(app)
      .post("/orders")
      .send({
        customerId: "customer-1",
        items: [{ productId: "product-1", quantity: 1 }]
      });

    const stored = await redis.get(`orders:${created.body.id}`);

    assert.ok(stored);
    assert.equal(JSON.parse(stored).id, created.body.id);
  });
});
