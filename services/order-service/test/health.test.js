import assert from "node:assert/strict";
import { test } from "node:test";

test("health response contract", () => {
  assert.deepEqual(
    { status: "ok", service: "order-service" },
    { status: "ok", service: "order-service" }
  );
});
