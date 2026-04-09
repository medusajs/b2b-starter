import {
  AdminCustomer,
  AdminOrder,
  AdminUser,
  FindParams,
  StoreCart,
} from "@medusajs/types";
import { B2BCustomer } from "../global";
import { ModuleQuote, ModuleQuoteMessage } from "./module";

export type QueryQuote = ModuleQuote & {
  draft_order: AdminOrder;
  cart: StoreCart;
  customer: B2BCustomer;
  messages: QueryQuoteMessage[];
};

export type QueryQuoteMessage = ModuleQuoteMessage & {
  customer: AdminCustomer;
  admin: AdminUser;
};

export type QuoteFilterParams = FindParams & {
  q?: string;
  id?: string | string[] | { [key: string]: any };
  draft_order_id?: string | string[] | { [key: string]: any };
  status?: string | string[] | { [key: string]: any };
  created_at?: { [key: string]: any };
  updated_at?: { [key: string]: any };
}