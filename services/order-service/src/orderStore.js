import { randomUUID } from "node:crypto";

const orders = new Map();

export function createOrder(input) {
  const order = {
    id: randomUUID(),
    customerId: input.customerId,
    items: input.items,
    status: "created",
    createdAt: new Date().toISOString()
  };

  orders.set(order.id, order);
  return order;
}

export function getOrder(id) {
  return orders.get(id) ?? null;
}

export function resetOrders() {
  orders.clear();
}
