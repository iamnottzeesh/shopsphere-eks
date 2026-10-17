const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { createCartProxy } = require("../src/cart-proxy");

async function listen(app) {
  const server = await new Promise(resolve => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });
  return {
    server,
    url: `http://127.0.0.1:${server.address().port}`
  };
}

async function stop(server) {
  await new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  });
}

test("cart proxy forwards allowed routes, bodies and upstream status", async t => {
  const seen = [];
  const upstream = express();
  upstream.use(express.json());
  upstream.use((req, res) => {
    seen.push({ method: req.method, path: req.path, body: req.body });
    const status = req.method === "POST" ? 201 :
      req.method === "PUT" ? 409 : 200;
    res.status(status).json({ result: "mock" });
  });

  const mock = await listen(upstream);
  t.after(() => stop(mock.server));

  const app = express();
  app.use(express.json());
  app.use("/api/carts", createCartProxy({ baseUrl: mock.url }));
  const proxy = await listen(app);
  t.after(() => stop(proxy.server));

  const id = "12345678-1234-4234-8234-123456789abc";
  const cases = [
    ["POST", "", {}, 201],
    ["GET", `/${id}`, undefined, 200],
    ["PUT", `/${id}/items/p-1`, { quantity: 2 }, 409],
    ["DELETE", `/${id}/items/p-1`, undefined, 200]
  ];

  for (const [method, path, body, expected] of cases) {
    const response = await fetch(`${proxy.url}/api/carts${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    assert.equal(response.status, expected);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { result: "mock" });
  }

  assert.equal(seen.length, 4);
  assert.equal(seen[0].path, "/carts");
  assert.equal(seen[1].path, `/carts/${id}`);
  assert.deepEqual(seen[2].body, { quantity: 2 });

  for (const path of ["/admin", `/${id}/items/not-a-product`]) {
    const response = await fetch(`${proxy.url}/api/carts${path}`);
    assert.equal(response.status, 404);
    await response.text();
  }
  assert.equal(seen.length, 4);
});
