import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { authenticate } from "@medusajs/medusa";
import { StoreCreateCreditOrder, StoreGetCreditAccountParams } from "./validators";

export const storeCreditAccountMiddlewares: MiddlewareRoute[] = [
  {
    method: "ALL",
    matcher: "/store/credit-account*",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["GET"],
    matcher: "/store/credit-account",
    middlewares: [validateAndTransformQuery(StoreGetCreditAccountParams, {})],
  },
  {
    method: ["POST"],
    matcher: "/store/credit-account/orders",
    middlewares: [validateAndTransformBody(StoreCreateCreditOrder)],
  },
];
