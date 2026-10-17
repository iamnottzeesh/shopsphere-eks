import { randomUUID } from "node:crypto";

const orders = new Map();

const allowedTransitions = {
  created: ["paid"],
  paid: ["shipped"],
  shipped: ["delivered"],
  delivered: []
};

export function createOrder(input) {
  const order = {
    id: randomUUID(),
    customerId: input.customerId,
    items: input.items,
    status: "created",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  orders.set(order.id, order);
  return order;
}

export function getOrder(id) {
  return orders.get(id) ?? null;
}

export function updateOrderStatus(id, nextStatus) {
  const order = orders.get(id);

  if (!order) {
    return { error: "not_found" };
  }

  const allowed = allowedTransitions[order.status] ?? [];

  if (!allowed.includes(nextStatus)) {
    return { error: "invalid_transition", currentStatus: order.status };
  }

  order.status = nextStatus;
  order.updatedAt = new Date().toISOString();
  orders.set(order.id, order);

  return { order };
}

export function resetOrders() {
  orders.clear();
}
