const grid = document.getElementById("product-grid");
const summary = document.getElementById("product-summary");
const serviceStatus = document.getElementById("service-status");

const productIcons = {
  "Wireless Keyboard": "⌨️",
  "Noise Cancelling Headphones": "🎧",
  "DevOps Engineer T-Shirt": "👕",
  "Laptop Stand": "💻"
};

function formatPrice(price, currency) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency
  }).format(price);
}

function renderProducts(products) {
  if (!products.length) {
    grid.innerHTML = '<div class="empty-state">No products found in this category.</div>';
    return;
  }

  grid.innerHTML = products.map((product) => `
    <article class="product-card">
      <div class="product-art">${productIcons[product.name] || "🛍️"}</div>
      <span class="product-category">${product.category}</span>
      <h3>${product.name}</h3>
      <div class="product-bottom">
        <span class="price">${formatPrice(product.price, product.currency)}</span>
        <span class="stock">${product.stock} in stock</span>
      </div>
    </article>
  `).join("");
}

async function loadProducts(category = "") {
  grid.innerHTML = '<div class="empty-state">Loading products...</div>';

  try {
    const endpoint = category
      ? `/products?category=${encodeURIComponent(category)}`
      : "/products";

    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error("Product request failed");
    }

    const data = await response.json();
    summary.textContent = `${data.count} product${data.count === 1 ? "" : "s"} available`;
    renderProducts(data.products);
  } catch (error) {
    summary.textContent = "Catalog unavailable";
    grid.innerHTML = '<div class="error-state">Unable to load products. Please refresh the page.</div>';
  }
}

async function checkServiceHealth() {
  try {
    const response = await fetch("/health");

    if (!response.ok) {
      throw new Error("Health check failed");
    }

    serviceStatus.classList.add("online");
    serviceStatus.innerHTML = '<span class="status-dot"></span><span>Service online</span>';
  } catch (error) {
    serviceStatus.classList.remove("online");
    serviceStatus.innerHTML = '<span class="status-dot"></span><span>Service unavailable</span>';
  }
}

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".filter.active").classList.remove("active");
    button.classList.add("active");
    loadProducts(button.dataset.category);
  });
});

checkServiceHealth();
loadProducts();
