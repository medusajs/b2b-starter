import { configureStoreSearch } from "@medusajs/framework/http";
import { MiddlewareRoute } from "@medusajs/medusa";

export const storeSearchMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/search",
    middlewares: [
      // The product index declares filterable `status` and `sales_channel_ids`,
      // so the route narrows it to published products in the key's sales
      // channels.
      configureStoreSearch({
        allowed_indexes: {
          product: true,
        },
      }),
    ],
  },
];
