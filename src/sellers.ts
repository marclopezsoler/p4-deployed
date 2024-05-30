import { Router } from "express";
import { z } from "zod";
import { catchErrors } from "./errors";
import { prisma } from "./db";
import { send } from "./response";

const sellersRoute = Router();
const idParamsSchema = z.object({ id: z.coerce.number() });
const nameParamsSchema = z.object({ name: z.coerce.string() });

const sellersBodySchema = z.object({
  name: z.string().min(3).max(50),
  email: z.string().email(),
});

const partialSellersBodySchema = sellersBodySchema.partial();

sellersRoute.get(
  "/",
  catchErrors(async (req, res) => {
    const totalSellers = await prisma.seller.count();
    const sellers = await prisma.seller.findMany({
      orderBy: { id: "asc" },
    });
    send(res).ok({
      msg: `Total sellers: ${totalSellers}`,
      sellers,
    });
  })
);

sellersRoute.get(
  "/?id=:id",
  catchErrors(async (req, res) => {
    const { id: sellerId } = idParamsSchema.parse(req.params);
    const seller = await prisma.seller.findUniqueOrThrow({
      where: { id: sellerId },
    });
    send(res).ok({ seller });
  })
);

sellersRoute.get(
  "/?name=:name",
  catchErrors(async (req, res) => {
    const { name: sellerName } = nameParamsSchema.parse(req.params);
    console.log(`Searching for seller with name: ${sellerName}`); // Add logging
    const seller = await prisma.seller.findMany({
      where: {
        name: {
          contains: sellerName,
        },
      },
    });
    send(res).ok({ seller });
  })
);

sellersRoute.post(
  "/",
  catchErrors(async (req, res) => {
    const data = sellersBodySchema.parse(req.body);
    const seller = await prisma.seller.create({ data });
    send(res).createdOk({
      msg: `Id from new seller: ${seller.id}`,
      seller,
    });
  })
);

sellersRoute.put(
  "/:id",
  catchErrors(async (req, res) => {
    const { id: sellerId } = idParamsSchema.parse(req.params);
    const bodyCheck = partialSellersBodySchema.parse(req.body);

    const updatedSeller = await prisma.seller.update({
      where: { id: sellerId },
      data: bodyCheck,
    });

    send(res).ok(updatedSeller);
  })
);

sellersRoute.delete(
  "/:id",
  catchErrors(async (req, res) => {
    const { id: sellerId } = idParamsSchema.parse(req.params);
    const seller = await prisma.seller;
    const products = await prisma.product.findMany({
      where: { sellerId },
      select: { id: true },
    });
    if (products.length > 0) {
      const orderIds = products.map((product) => product.id);
      send(res).ok({
        msg: `Seller with ID: ${sellerId} cannot be deleted. This seller has active products (${orderIds.join(
          ", "
        )}). Please handle them before deleting the seller.`,
      });
    } else {
      const seller = await prisma.seller.delete({
        where: { id: sellerId },
      });
      send(res).ok({ msg: `Seller deleted with ID: ${sellerId}` });
    }
  })
);

export default sellersRoute;