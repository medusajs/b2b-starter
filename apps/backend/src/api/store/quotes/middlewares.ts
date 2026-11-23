import {
  authenticate,
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { MiddlewareRoute } from "@medusajs/medusa";
import {
  listQuotesTransformQueryConfig,
  retrieveQuoteTransformQueryConfig,
} from "./query-config";
import {
  AcceptQuote,
  CreateQuote,
  GetQuoteParams,
  RejectQuote,
  StoreCreateQuoteMessage,
} from "./validators";

const ensureQuoteOwner = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: [quote] } = await query.graph({
    entity: "quote",
    fields: ["id"],
    filters: {
      id: req.params.id,
      customer_id: req.auth_context.actor_id,
    },
  });

  if (!quote) {
    res.status(404).json({ message: "Quote not found" });
    return;
  }

  next();
};

export const storeQuotesMiddlewares: MiddlewareRoute[] = [
  {
    method: "ALL",
    matcher: "/store/quotes*",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["GET"],
    matcher: "/store/quotes",
    middlewares: [
      validateAndTransformQuery(GetQuoteParams, listQuotesTransformQueryConfig),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/quotes",
    middlewares: [
      validateAndTransformBody(CreateQuote),
      validateAndTransformQuery(
        GetQuoteParams,
        retrieveQuoteTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/quotes/:id",
    middlewares: [
      validateAndTransformQuery(
        GetQuoteParams,
        retrieveQuoteTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/quotes/:id/accept",
    middlewares: [
      ensureQuoteOwner,
      validateAndTransformBody(AcceptQuote),
      validateAndTransformQuery(
        GetQuoteParams,
        retrieveQuoteTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/quotes/:id/reject",
    middlewares: [
      ensureQuoteOwner,
      validateAndTransformBody(RejectQuote),
      validateAndTransformQuery(
        GetQuoteParams,
        retrieveQuoteTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/quotes/:id/preview",
    middlewares: [
      ensureQuoteOwner,
      validateAndTransformQuery(
        GetQuoteParams,
        retrieveQuoteTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/quotes/:id/messages",
    middlewares: [
      ensureQuoteOwner,
      validateAndTransformBody(StoreCreateQuoteMessage),
      validateAndTransformQuery(
        GetQuoteParams,
        retrieveQuoteTransformQueryConfig
      ),
    ],
  },
];
