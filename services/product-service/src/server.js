const express = require("express");
const products = require("./products");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("src/public"));

app.get("/", (req, res) => {
  res.status(200).json({
    service: "product-service",
    version: "1.0.0",
    status: "running"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "product-service",
    timestamp: new Date().toISOString()
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
