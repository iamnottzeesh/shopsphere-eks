import express from "express";

const app = express();
const port = process.env.PORT || 8080;

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "order-service" });
});

app.listen(port, () => {
  console.log(`order-service listening on port ${port}`);
});
