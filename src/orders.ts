import { Router } from "express";
import { z } from "zod";
import { catchErrors } from "./errors";
import { prisma } from "./db";
import { send } from "./response";

const ordersRouter = Router();
const idParamsSchema = z.object({ id: z.coerce.number() });

const ordersBodySchema = z.object({
  clientId: z.number(),
  sellerId: z.number(),
  productId: z.number(),
  status: z.string(),
});

const partialOrdersBodySchema = ordersBodySchema.partial();

ordersRouter.get(
  "/",
  catchErrors(async (req, res) => {
    const totalOrders = await prisma.order.count();
    const orders = await prisma.order.findMany({
      orderBy: { id: "asc" },
    });
    send(res).ok({
      msg: `Total orders: ${totalOrders}`,
      orders,
    });
  })
);

ordersRouter.get(
  "/:id",
  catchErrors(async (req, res) => {
    const { id: orderId } = idParamsSchema.parse(req.params);
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
    });
    send(res).ok({ order });
  })
);

ordersRouter.post(
  "/",
  catchErrors(async (req, res) => {
    const data = ordersBodySchema.parse(req.body);
    const order = await prisma.order.create({ data });
    send(res).createdOk({
      msg: `New order ID: ${order.id}`,
      order,
    });
  })
);

ordersRouter.put(
  "/:id",
  catchErrors(async (req, res) => {
    const { id: orderId } = idParamsSchema.parse(req.params);
    const bodyCheck = partialOrdersBodySchema.parse(req.body);

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: bodyCheck,
    });

    send(res).ok(updatedOrder);
  })
);

ordersRouter.delete(
  "/:id",
  catchErrors(async (req, res) => {
    const { id: orderId } = idParamsSchema.parse(req.params);
    const order = await prisma.order.delete({
      where: { id: orderId },
    });
    send(res).ok({ msg: `Order deleted: ${orderId}` });
  })
);

export default ordersRouter;
