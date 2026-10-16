const { createProductClient } = require("./product-client");
const { createCartStore } = require("./cart-store");
const express = require("express");
const { randomUUID } = require("node:crypto");

function createCartRouter({
  getProduct = createProductClient(),
  store = createCartStore()
} = {}) {
  const router = express.Router();

  router.post("/", async (req, res, next) => {
    try {
      const cart = await store.create();
      return res.status(201).json(cart);
    } catch (error) {
      return next(error);
    }
  });

  router.param("cartId", async (req, res, next, cartId) => {
    try {
      const cart = await store.get(cartId);
      if (!cart) {
        return res.status(404).json({ error: "Cart not found" });
      }
      req.cart = cart;
      return next();
    } catch (error) {
      return next(error);
    }
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
      const cart = {
        ...req.cart,
        items: [...items, item]
      };
      recalculate(cart);
      if (!Number.isSafeInteger(cart.total)) {
        return res.status(422).json({ error: "Cart total exceeds supported range" });
      }
      const saved = await store.save(cart);
      return res.json(saved);
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:cartId/items/:productId", async (req, res, next) => {
    try {
      const cart = {
        ...req.cart,
        items: req.cart.items.filter(
          item => item.productId !== req.params.productId
        )
      };
      recalculate(cart);
      const saved = await store.save(cart);
      return res.json(saved);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { createCartRouter };
