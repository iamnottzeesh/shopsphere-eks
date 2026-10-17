import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import request from "supertest";
import app from "../src/app.js";
import { connectRedis, closeRedis } from "../src/redis.js";

describe("GET /health", () => {
  it("returns service health", async () => {
    const response = await request(app).get("/health");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      status: "ok",
      service: "order-service"
    });
  });

  after(async () => {
    await closeRedis();
  });
});
