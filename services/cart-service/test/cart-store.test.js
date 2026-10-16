const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createRedisStore } = require("../src/cart-store");

test("Redis cart store persists across store instances", { timeout: 10000 }, async () => {
  const redisUrl = process.env.TEST_REDIS_URL;
  if (!redisUrl) {
    console.log("TEST_REDIS_URL not set; skipping Redis store test");
    return;
  }

  const firstStore = createRedisStore({ redisUrl });
  const secondStore = createRedisStore({ redisUrl });

  try {
    const created = await firstStore.create();
    assert.equal(created.total, 0);
    assert.equal(created.items.length, 0);

    const updated = await firstStore.save({
      ...created,
      items: [{
        productId: "p-101",
        name: "Wireless Keyboard",
        unitPrice: 2499,
        quantity: 2
      }],
      total: 4998
    });
    assert.equal(updated.total, 4998);

    const loaded = await secondStore.get(created.id);
    assert.equal(loaded.total, 4998);
    assert.equal(loaded.items[0].productId, "p-101");

    assert.equal(await secondStore.get("does-not-exist"), null);
  } finally {
    await firstStore.close();
    await secondStore.close();
  }
});
