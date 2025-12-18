import { AdminOrderPreview, PaginatedResponse } from "@medusajs/types";
import { QueryQuote } from "./query";

/* Store */

export type StoreQuoteResponse = {
  quote: QueryQuote;
};

export type StoreQuotesResponse = PaginatedResponse<{
  quotes: QueryQuote[];
}>;

export type StoreQuotePreviewResponse = {
  quote: QueryQuote & {
    order_preview: AdminOrderPreview;
  };
};

export type StoreCreateQuote = {
  cart_id: string;
};

export type StoreCreateQuoteMessage = {
  text: string;
  item_id?: string;
};
