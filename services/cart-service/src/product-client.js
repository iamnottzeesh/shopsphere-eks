function serviceError(status, message) {
  return Object.assign(new Error(message), { status });
}

function createProductClient({
  baseUrl = process.env.PRODUCT_SERVICE_URL || "http://127.0.0.1:3000",
  timeoutMs = 2000
} = {}) {
  const base = new URL(baseUrl);
  if (!["http:", "https:"].includes(base.protocol)) {
    throw new Error("Unsupported product-service URL protocol");
  }

  return async function getProduct(productId) {
    const url = new URL(
      `/products/${encodeURIComponent(productId)}`,
      base
    );

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        redirect: "error"
      });

      if (response.status === 404) {
        await response.body?.cancel();
        throw serviceError(404, "Product not found");
      }
      if (!response.ok) {
        await response.body?.cancel();
        throw serviceError(502, "Product service returned an error");
      }

      const product = await response.json();
      if (
        !product ||
        product.id !== productId ||
        typeof product.name !== "string" ||
        !Number.isSafeInteger(product.price) ||
        product.price < 0 ||
        product.currency !== "INR" ||
        !Number.isSafeInteger(product.stock) ||
        product.stock < 0
      ) {
        throw serviceError(502, "Invalid product response");
      }

      return product;
    } catch (error) {
      if ([404, 502].includes(error.status)) throw error;
      if (error.name === "TimeoutError" || error.name === "AbortError") {
        throw serviceError(504, "Product service timed out");
      }
      throw serviceError(502, "Product service unavailable or invalid response");
    }
  };
}

module.exports = { createProductClient };
