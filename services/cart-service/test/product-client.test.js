const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { once } = require("node:events");
const { createProductClient } = require("../src/product-client");

test("product client HTTP responses and timeout", { timeout: 10000 }, async () => {
  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/products/p-999") {
      res.writeHead(404).end('{"error":"Not found"}');
    } else if (req.url === "/products/p-500") {
      res.writeHead(500).end('{"error":"Upstream failed"}');
    } else if (req.url === "/products/p-998") {
      return;
    } else if (req.url === "/products/p-997") {
      res.end('{"id":"p-997","price":-1}');
    } else if (req.url === "/products/p-996") {
      res.end("invalid-json");
    } else {
      res.end(JSON.stringify({
        id: "p-101",
        name: "Keyboard",
        price: 2499,
        currency: "INR",
        stock: 35
      }));
    }
  });

  server.listen(0, "127.0.0.1");
  try {
    await once(server, "listening");
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const getProduct = createProductClient({ baseUrl, timeoutMs: 2000 });

    const product = await getProduct("p-101");
    assert.equal(product.id, "p-101");
    assert.equal(product.price, 2499);

    for (const [id, status] of [
      ["p-999", 404],
      ["p-500", 502],
      ["p-997", 502],
      ["p-996", 502],
      ["p-102", 502]
    ]) {
      await assert.rejects(getProduct(id), error => error.status === status);
    }

    const shortTimeout = createProductClient({ baseUrl, timeoutMs: 100 });
    await assert.rejects(
      shortTimeout("p-998"),
      error => error.status === 504
    );

    assert.throws(
      () => createProductClient({ baseUrl: "file:///tmp/products" }),
      /Unsupported/
    );
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
      server.closeAllConnections();
    });
  }
});
