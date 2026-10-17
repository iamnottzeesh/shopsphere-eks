(() => {
  const items = document.getElementById("cart-items");
  const message = document.getElementById("cart-message");
  const total = document.getElementById("cart-total");
  const refresh = document.getElementById("cart-refresh");
  const storageKey = "shopsphere.demo.cartId";

  let cartId = "";
  let busy = false;

  try {
    cartId = localStorage.getItem(storageKey) || "";
  } catch {
    message.textContent = "Browser storage unavailable; cart will not survive refresh.";
  }

  function remember(id) {
    cartId = id;
    try {
      if (id) localStorage.setItem(storageKey, id);
      else localStorage.removeItem(storageKey);
    } catch {
      message.textContent = "Browser storage unavailable; cart will not survive refresh.";
    }
  }

  const money = value => new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(value);

  function button(label, action, productId) {
    const element = document.createElement("button");
    element.type = "button";
    element.className = "cart-action";
    element.textContent = label;
    element.dataset.cartAction = action;
    element.dataset.productId = productId;
    return element;
  }

  function render(cart) {
    items.replaceChildren();

    if (!cart.items.length) {
      const empty = document.createElement("p");
      empty.textContent = "Your cart is empty.";
      items.append(empty);
    }

    for (const item of cart.items) {
      const row = document.createElement("div");
      row.className = "cart-row";

      const description = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = item.name;
      const price = document.createElement("p");
      price.textContent =
        `${money(item.unitPrice)} × ${item.quantity} = ` +
        money(item.unitPrice * item.quantity);
      description.append(name, price);

      const controls = document.createElement("div");
      controls.className = "cart-controls";

      const label = document.createElement("label");
      label.textContent = "Quantity ";
      const quantity = document.createElement("input");
      quantity.type = "number";
      quantity.min = "1";
      quantity.max = "99";
      quantity.step = "1";
      quantity.value = String(item.quantity);
      label.append(quantity);

      controls.append(
        label,
        button("Update", "update", item.productId),
        button("Remove", "remove", item.productId)
      );
      row.append(description, controls);
      items.append(row);
    }

    total.textContent = `Total: ${money(cart.total)}`;
  }

  async function api(path = "", method = "GET", body) {
    const response = await fetch(`/api/carts${path}`, {
      method,
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
      cache: "no-store"
    });

    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error || `Cart request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  async function loadExisting() {
    if (!cartId) return null;
    try {
      return await api(`/${encodeURIComponent(cartId)}`);
    } catch (error) {
      if (error.status !== 404) throw error;
      remember("");
      render({ items: [], total: 0 });
      message.textContent = "Previous cart expired or was removed. Add an item to start again.";
      return null;
    }
  }

  async function run(action) {
    if (busy) return;
    busy = true;
    message.textContent = "Updating cart...";
    refresh.disabled = true;
    items.setAttribute("aria-busy", "true");

    try {
      await action();
    } catch (error) {
      message.textContent = ["TimeoutError", "AbortError"].includes(error.name)
        ? "Cart request timed out. Refresh cart before retrying."
        : error.message || "Unable to update cart. Please refresh cart.";
    } finally {
      busy = false;
      refresh.disabled = false;
      items.setAttribute("aria-busy", "false");
    }
  }

  document.getElementById("product-grid").addEventListener("click", event => {
    const target = event.target.closest("[data-add-product]");
    if (!target || target.disabled || busy) return;

    run(async () => {
      let cart = await loadExisting();
      if (!cart) {
        cart = await api("", "POST", {});
        remember(cart.id);
      }

      const productId = decodeURIComponent(target.dataset.addProduct);
      const existing = cart.items.find(item => item.productId === productId);
      const quantity = (existing?.quantity || 0) + 1;
      if (quantity > 99) throw new Error("Maximum quantity is 99.");

      const updated = await api(
        `/${encodeURIComponent(cartId)}/items/${encodeURIComponent(productId)}`,
        "PUT",
        { quantity }
      );
      render(updated);
      message.textContent = "Item added to cart.";
    });
  });

  items.addEventListener("click", event => {
    const target = event.target.closest("[data-cart-action]");
    if (!target || busy || !cartId) return;

    run(async () => {
      const path = `/${encodeURIComponent(cartId)}/items/` +
        encodeURIComponent(target.dataset.productId);

      let updated;
      if (target.dataset.cartAction === "remove") {
        updated = await api(path, "DELETE");
      } else {
        const input = target.closest(".cart-row").querySelector("input");
        const quantity = Number(input.value);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
          throw new Error("Quantity must be an integer from 1 to 99.");
        }
        updated = await api(path, "PUT", { quantity });
      }

      render(updated);
      message.textContent = "Cart updated.";
    });
  });

  async function refreshCart() {
    const hadId = Boolean(cartId);
    const cart = await loadExisting();
    if (cart) {
      render(cart);
      message.textContent = "Cart loaded.";
    } else if (!hadId) {
      render({ items: [], total: 0 });
      message.textContent = "Add a product to start your cart.";
    }
  }

  refresh.addEventListener("click", () => run(refreshCart));
  run(refreshCart);
})();
