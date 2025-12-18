import {
  AdminCustomer,
  AdminOrder,
  AdminUser,
  StoreCart,
} from "@medusajs/types";
import { ModuleQuote, ModuleQuoteMessage } from "./module.js";
import { QueryEmployee } from "../company/index.js";

export type QueryQuote = ModuleQuote & {
  draft_order: AdminOrder;
  cart: StoreCart;
  customer: AdminCustomer & {
    employee: QueryEmployee;
  };
  messages: QueryQuoteMessage[];
};

export type QueryQuoteMessage = ModuleQuoteMessage & {
  customer: AdminCustomer;
  admin: AdminUser;
};
