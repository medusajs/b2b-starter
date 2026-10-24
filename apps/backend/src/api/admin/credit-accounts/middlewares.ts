import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { authenticate } from "@medusajs/medusa";
import {
  AdminCreateCreditAccount,
  AdminCreateCreditPayment,
  AdminGetCreditAccountParams,
  AdminUpdateCreditAccount,
} from "./validators";

export const adminCreditAccountMiddlewares: MiddlewareRoute[] = [
  {
    method: "ALL",
    matcher: "/admin/credit-accounts*",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
  {
    method: ["GET"],
    matcher: "/admin/credit-accounts",
    middlewares: [validateAndTransformQuery(AdminGetCreditAccountParams, {})],
  },
  {
    method: ["POST"],
    matcher: "/admin/credit-accounts",
    middlewares: [validateAndTransformBody(AdminCreateCreditAccount)],
  },
  {
    method: ["GET"],
    matcher: "/admin/credit-accounts/:id",
    middlewares: [validateAndTransformQuery(AdminGetCreditAccountParams, {})],
  },
  {
    method: ["POST"],
    matcher: "/admin/credit-accounts/:id",
    middlewares: [validateAndTransformBody(AdminUpdateCreditAccount)],
  },
  {
    method: ["POST"],
    matcher: "/admin/credit-accounts/:id/payments",
    middlewares: [validateAndTransformBody(AdminCreateCreditPayment)],
  },
];
