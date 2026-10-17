import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import request from "supertest";
import app from "../src/app.js";
import { resetOrders } from "../src/orderStore.js";

describe("order API", () => {
  beforeEach(() => {
    resetOrders();
  });

  it("creates an order", async () => {
    const response = await request(app)
      .post("/orders")
      .send({
        customerId: "customer-1",
        items: [{ productId: "product-1", quantity: 2 }]
      });

    assert.equal(response.status, 201);
    assert.equal(response.body.customerId, "customer-1");
    assert.equal(response.body.status, "created");
    assert.equal(response.body.items.length, 1);
  });

  it("rejects an order without items", async () => {
    const response = await request(app)
      .post("/orders")
      .send({ customerId: "customer-1", items: [] });

    assert.equal(response.status, 400);
  });

  it("returns a created order by id", async () => {
    const created = await request(app)
      .post("/orders")
      .send({
        customerId: "customer-1",
        items: [{ productId: "product-1", quantity: 1 }]
      });

    const response = await request(app).get(`/orders/${created.body.id}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.id, created.body.id);
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
});
