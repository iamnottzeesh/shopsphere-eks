const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { once } = require("node:events");
const { createApp } = require("../src/app");
const { createProductClient } = require("../src/product-client");

test("cart integrates with product API over HTTP", { timeout: 10000 }, async () => {
  const calls = [];
  const productServer = http.createServer((req, res) => {
    calls.push(req.url);
    res.setHeader("Content-Type", "application/json");
    if (req.url !== "/products/p-101") {
      return res.writeHead(404).end('{"error":"Not found"}');
    }
    res.end(JSON.stringify({
      id: "p-101", name: "Wireless Keyboard",
      price: 2499, currency: "INR", stock: 35
    }));
  });
  let cartServer;
  try {
    productServer.listen(0, "127.0.0.1");
    await once(productServer, "listening");
    const getProduct = createProductClient({
      baseUrl: `http://127.0.0.1:${productServer.address().port}`
    });
    cartServer = createApp({ getProduct }).listen(0, "127.0.0.1");
    await once(cartServer, "listening");
    const base = `http://127.0.0.1:${cartServer.address().port}`;

    const created = await fetch(`${base}/carts`, {
      method: "POST", signal: AbortSignal.timeout(2000)
    });
    assert.equal(created.status, 201);
    const cart = await created.json();

    const response = await fetch(`${base}/carts/${cart.id}/items/p-101`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: 2, price: 1 }),
      signal: AbortSignal.timeout(3000)
    });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.total, 4998);
    assert.equal(result.currency, "INR");
    assert.equal(result.items[0].name, "Wireless Keyboard");
    assert.equal(result.items[0].unitPrice, 2499);
    assert.deepEqual(calls, ["/products/p-101"]);
  } finally {
    for (const server of [cartServer, productServer]) {
      if (!server?.listening) continue;
      await new Promise((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
        server.closeAllConnections();
      });
    }
  }
});
