const express = require("express");
const products = require("./products");

const app = express();
const port = process.env.PORT || 3000;
const serviceName = process.env.SERVICE_NAME || "product-service";
const serviceVersion = process.env.SERVICE_VERSION || "1.0.1";
const appEnvironment = process.env.APP_ENV || "development";
const defaultCurrency = process.env.DEFAULT_CURRENCY || "INR";

// Structured HTTP request logging.
app.use((req, res, next) => {
  const requestId = require("node:crypto").randomUUID();
  const startedAt = process.hrtime.bigint();

  res.setHeader("X-Request-ID", requestId);

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      event: "http_request",
      service: serviceName,
      version: serviceVersion,
      requestId,
      method: req.method,
      route: req.route ? req.route.path : "static_or_unmatched",
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(3))
    }));
  });

  next();
});

app.use(express.json());
app.use("/api/carts", require("./cart-proxy").createCartProxy());
app.use(express.static("src/public"));

app.get("/", (req, res) => {
  res.status(200).json({
    service: serviceName,
    version: serviceVersion,
    status: "running"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: serviceName,
    timestamp: new Date().toISOString()
  });
});

app.get("/config", (req, res) => {
  res.status(200).json({
    service: serviceName,
    version: serviceVersion,
    environment: appEnvironment,
    defaultCurrency
  });
});

app.get("/products", (req, res) => {
  const { category } = req.query;

  const filteredProducts = category
    ? products.filter((product) => product.category === category)
    : products;

  res.status(200).json({
    count: filteredProducts.length,
    products: filteredProducts
  });
});

app.get("/products/:id", (req, res) => {
  const product = products.find((item) => item.id === req.params.id);

  if (!product) {
    return res.status(404).json({
      error: "Product not found",
      productId: req.params.id
    });
  }

  return res.status(200).json(product);
});

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`product-service listening on port ${port}`);
});
