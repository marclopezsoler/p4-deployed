import { Router } from "express";
import { z } from "zod";
import { catchErrors } from "./errors";
import { prisma } from "./db";
import { send } from "./response";

const productsRouter = Router();
const idParamsSchema = z.object({ id: z.coerce.number() });

const productsBodySchema = z.object({
  name: z.string().min(3).max(50),
  price: z.number(),
  description: z.string().min(15).max(255),
  color: z.string().min(3).max(25),
  sellerId: z.number(),
});

const partialProductsBodySchema = productsBodySchema.partial();

productsRouter.get(
  "/",
  catchErrors(async (req, res) => {
    const totalProducts = await prisma.product.count();
    const products = await prisma.product.findMany({
      orderBy: { id: "asc" },
    });
    send(res).ok({
      msg: `Total products: ${totalProducts}`,
      products,
    });
  })
);

productsRouter.get(
  "/:id",
  catchErrors(async (req, res) => {
    const { id: productId } = idParamsSchema.parse(req.params);
    const product = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
    });
    send(res).ok({ product });
  })
);

productsRouter.post(
  "/",
  catchErrors(async (req, res) => {
    const data = productsBodySchema.parse(req.body);
    const product = await prisma.product.create({ data });
    send(res).createdOk({
      msg: `Id from new product: ${product.id}`,
      product,
    });
  })
);

productsRouter.put(
  "/:id",
  catchErrors(async (req, res) => {
    const { id: productId } = idParamsSchema.parse(req.params);
    const bodyCheck = partialProductsBodySchema.parse(req.body);

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: bodyCheck,
    });

    send(res).ok(updatedProduct);
  })
);

productsRouter.delete(
  "/:id",
  catchErrors(async (req, res) => {
    const { id: productId } = idParamsSchema.parse(req.params);
    const product = await prisma.product;
    const orders = await prisma.order.findMany({
      where: { productId },
      select: { id: true },
    });
    if (orders.length > 0) {
      const orderIds = orders.map((order) => order.id);
      console.error(`${productId} cannot be deleted.`);
      console.error(
        `This product has active orders (${orderIds.join(
          ", "
        )}). Please handle them before deleting the product.`
      );
    } else {
      const product = await prisma.product.delete({
        where: { id: productId },
      });
    }
    send(res).ok({ msg: `Product deleted with ID: ${productId}` });
  })
);

export default productsRouter;
