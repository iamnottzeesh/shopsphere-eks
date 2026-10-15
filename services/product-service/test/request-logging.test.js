const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const path = require("node:path");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

test("HTTP request logging and request-ID correlation", { timeout: 15000 }, async () => {
  const child = spawn(process.execPath, ["src/server.js"], {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, PORT: "3101" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  let errors = "";
  let spawnError;
  child.on("error", error => { spawnError = error; });
  child.stdout.on("data", chunk => { output += chunk; });
  child.stderr.on("data", chunk => { errors += chunk; });

  try {
    for (let i = 0; i < 50 && !output.includes("listening on port"); i++) {
      if (spawnError) throw spawnError;
      assert.equal(child.exitCode, null, errors);
      await sleep(100);
    }
    assert.ok(output.includes("listening on port"), "Server did not start");

    const cases = [
      ["/health", 200, "/health"],
      ["/products?category=electronics&test_secret=DO_NOT_LOG", 200, "/products"],
      ["/products/nonexistent-logging-test", 404, "/products/:id"]
    ];
    const ids = [];
    for (const [url, status, route] of cases) {
      const response = await fetch(`http://127.0.0.1:3101${url}`, {
        signal: AbortSignal.timeout(2000)
      });
      await response.text();
      assert.equal(response.status, status);
      const id = response.headers.get("x-request-id");
      assert.match(id || "", /^[0-9a-f-]{36}$/);
      ids.push(id);

      let row;
      for (let i = 0; i < 20 && !row; i++) {
        row = output.split("\n").flatMap(line => {
          try { return [JSON.parse(line)]; } catch { return []; }
        }).find(entry => entry.requestId === id);
        if (!row) await sleep(50);
      }
      assert.ok(row, "Matching request log missing");
      assert.equal(row.event, "http_request");
      assert.equal(row.method, "GET");
      assert.equal(row.route, route);
      assert.equal(row.statusCode, status);
      assert.ok(Number.isFinite(row.durationMs) && row.durationMs >= 0);
    }
    assert.equal(new Set(ids).size, cases.length);
    assert.ok(!output.includes("DO_NOT_LOG"), "Query value leaked");
  } finally {
    if (child.pid && child.exitCode === null && child.signalCode === null) {
      const exited = once(child, "exit");
      child.kill("SIGTERM");
      await exited;
    }
  }
});
