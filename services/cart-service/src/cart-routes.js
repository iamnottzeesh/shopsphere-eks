const { createProductClient } = require("./product-client");
const express = require("express");
const { randomUUID } = require("node:crypto");

function createCartRouter({ getProduct = createProductClient() } = {}) {
  const router = express.Router();
  const carts = new Map();

  router.post("/", (req, res) => {
    if (carts.size >= 1000) {
      return res.status(503).json({ error: "Demo cart capacity reached" });
    }

    const cart = {
      id: randomUUID(),
      currency: "INR",
      items: [],
      total: 0
    };
    carts.set(cart.id, cart);
    return res.status(201).json(cart);
  });

  router.param("cartId", (req, res, next, cartId) => {
    const cart = carts.get(cartId);
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }
    req.cart = cart;
    next();
  });

  router.get("/:cartId", (req, res) => {
    res.json(req.cart);
  });


  function recalculate(cart) {
    cart.total = cart.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity, 0
    );
  }

  router.put("/:cartId/items/:productId", async (req, res, next) => {
    const quantity = req.body?.quantity;
    const productId = req.params.productId;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return res.status(400).json({ error: "Quantity must be an integer from 1 to 99" });
    }
    if (!/^p-[0-9]{1,12}$/.test(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    try {
      const product = await getProduct(productId);
      if (quantity > product.stock) {
        return res.status(409).json({ error: "Requested quantity exceeds stock" });
      }
      const items = req.cart.items.filter(item => item.productId !== productId);
      if (items.length >= 100) {
        return res.status(409).json({ error: "Demo cart item limit reached" });
      }
      const item = {
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity
      };
      const total = [...items, item].reduce(
        (sum, entry) => sum + entry.unitPrice * entry.quantity, 0
      );
      if (!Number.isSafeInteger(total)) {
        return res.status(422).json({ error: "Cart total exceeds supported range" });
      }
      req.cart.items = [...items, item];
      recalculate(req.cart);
      return res.json(req.cart);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:cartId/items/:productId", (req, res) => {
    req.cart.items = req.cart.items.filter(
      item => item.productId !== req.params.productId
    );
    recalculate(req.cart);
    res.json(req.cart);
  });

  return router;
}

module.exports = { createCartRouter };
