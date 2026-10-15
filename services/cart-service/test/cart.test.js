const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { createApp } = require("../src/app");

test("cart API validation and mutations", { timeout: 15000 }, async () => {
  const getProduct = async id => {
    if (id === "p-999") throw Object.assign(new Error("Product not found"), { status: 404 });
    if (id === "p-998") throw Object.assign(new Error("Product service timed out"), { status: 504 });
    return { id, name: "Keyboard", price: 2499, currency: "INR", stock: 35 };
  };
  const server = createApp({ getProduct }).listen(0, "127.0.0.1");
  try {
    await once(server, "listening");
    const base = `http://127.0.0.1:${server.address().port}`;
    async function request(method, route, status, body) {
      const response = await fetch(base + route, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(2000)
      });
      assert.equal(response.status, status, `${method} ${route}`);
      return response.json();
    }

    await request("GET", "/health", 200);
    await request("GET", "/carts/missing", 404);
    const cart = await request("POST", "/carts", 201);
    assert.equal(cart.total, 0);
    const route = `/carts/${cart.id}`;
    let result = await request("PUT", `${route}/items/p-101`, 200,
      { quantity: 2, price: 1 });
    assert.equal(result.total, 4998);
    assert.equal(result.items[0].unitPrice, 2499);

    result = await request("PUT", `${route}/items/p-101`, 200, { quantity: 3 });
    assert.equal(result.items.length, 1);
    assert.equal(result.total, 7497);

    for (const quantity of [0, -1, 1.5, "2", 100, null]) {
      await request("PUT", `${route}/items/p-101`, 400, { quantity });
    }
    await request("PUT", `${route}/items/p-101`, 409, { quantity: 36 });
    await request("PUT", `${route}/items/invalid`, 400, { quantity: 1 });
    await request("PUT", `${route}/items/p-999`, 404, { quantity: 1 });
    await request("PUT", `${route}/items/p-998`, 504, { quantity: 1 });

    result = await request("GET", route, 200);
    assert.equal(result.total, 7497);
    assert.equal(result.items.length, 1);
    result = await request("DELETE", `${route}/items/p-101`, 200);
    assert.deepEqual(result.items, []);
    assert.equal(result.total, 0);
    await request("DELETE", `${route}/items/p-101`, 200);
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
      server.closeAllConnections();
    });
  }
});
