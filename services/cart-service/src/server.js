const { createApp } = require("./app");

const port = Number(process.env.PORT || 3001);
const server = createApp().listen(port, "0.0.0.0", () => {
  console.log(JSON.stringify({
    event: "service_started",
    service: "shopsphere-cart-service",
    port
  }));
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
