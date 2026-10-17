import { randomUUID } from "node:crypto";
import { redis } from "./redis.js";

const orderKeyPrefix = "orders:";
const allowedTransitions = {
  created: ["paid"],
  paid: ["shipped"],
  shipped: ["delivered"],
  delivered: []
};

function keyFor(id) {
  return `${orderKeyPrefix}${id}`;
}

export async function createOrder(input) {
  const order = {
    id: randomUUID(),
    customerId: input.customerId,
    items: input.items,
    status: "created",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await redis.set(keyFor(order.id), JSON.stringify(order));
  return order;
}

export async function getOrder(id) {
  const raw = await redis.get(keyFor(id));
  return raw ? JSON.parse(raw) : null;
}

export async function updateOrderStatus(id, nextStatus) {
  const order = await getOrder(id);

  if (!order) {
    return { error: "not_found" };
  }

  const allowed = allowedTransitions[order.status] ?? [];

  if (!allowed.includes(nextStatus)) {
    return {
      error: "invalid_transition",
      currentStatus: order.status
    };
  }

  order.status = nextStatus;
  order.updatedAt = new Date().toISOString();

  await redis.set(keyFor(order.id), JSON.stringify(order));
  return { order };
}

export async function resetOrders() {
  const keys = await redis.keys(`${orderKeyPrefix}*`);

  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
