# Cart Service

Stateless cart API for ShopSphere. It stores carts in memory for this local prototype and validates item quantities against the Product Service before updating a cart.

## API

| Method | Route | Description |
|---|---|---|
| GET | `/health` | Liveness/readiness probe |
| POST | `/carts` | Create an empty cart |
| GET | `/carts/:cartId` | Read a cart |
| PUT | `/carts/:cartId/items/:productId` | Add or replace an item |
| DELETE | `/carts/:cartId/items/:productId` | Remove an item |

The product lookup uses `PRODUCT_SERVICE_URL`; when absent, it defaults to `http://product-service:3000`.

## Local commands

```bash
npm install
npm test
npm start
```

## Container commands

```bash
docker build -t shopsphere-cart-service:local .
docker run --rm -p 127.0.0.1:3000:3000 shopsphere-cart-service:local
```

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP listener port |
| `PRODUCT_SERVICE_URL` | `http://product-service:3000` | Product API base URL |
| `PRODUCT_TIMEOUT_MS` | `2000` | Product API timeout |

## Tests

The suite includes cart API validation, product-client HTTP/timeout behavior, and an HTTP-level cart-to-product integration test.
