import type { ErrorRequestHandler, RequestHandler } from "express";
import type { ZodError } from "zod";
import { send } from "./response";

const zodErrorMessage = (err: ZodError) => {
  const [firstIssue] = err.issues;
  const { code, path } = firstIssue;
  console.log(code);
  switch (code) {
    case "too_small":
      return `${path[0]} is too small!`;
    case "too_big":
      return `${path[0]} is too big!`;
    case "invalid_type":
      return `${path[0]} format is wrong!`;
    default:
      return `Input data is wrong.`;
  }
};

export const defaultErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  next
) => {
  console.log(err.name);
  switch (err.name) {
    case "NotFoundError":
      return send(res).notFound();

    case "PrismaClientKnownRequestError":
      return send(res).badRequest("Element to update not found");

    case "ZodError":
      return send(res).badRequest(zodErrorMessage(err));

    default:
      return send(res).internalError(`Internal error.`);
  }
};

export const catchErrors =
  (myHandler: RequestHandler): RequestHandler =>
  async (req, res, next) => {
    try {
      await myHandler(req, res, next);
    } catch (e: any) {
      next(e);
    }
  };
