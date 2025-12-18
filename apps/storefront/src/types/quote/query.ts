import {
  AdminCustomer,
  AdminOrder,
  AdminUser,
  StoreCart,
} from "@medusajs/types";
import { ModuleQuote, ModuleQuoteMessage } from "./module";

export type QueryQuote = ModuleQuote & {
  draft_order: AdminOrder;
  cart: StoreCart;
  customer: AdminCustomer & {
    employee: {
      id: string;
      spending_limit: number;
      is_admin: boolean;
      company_id: string;
    };
  };
  messages: QueryQuoteMessage[];
};

export type QueryQuoteMessage = ModuleQuoteMessage & {
  customer: AdminCustomer;
  admin: AdminUser;
};
