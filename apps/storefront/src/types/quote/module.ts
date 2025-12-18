/* Entity: Quote */

export type ModuleQuote = {
  id: string;
  status: string;
  draft_order_id: string;
  order_change_id: string;
  cart_id: string;
  customer_id: string;
  created_at: string;
  updated_at: string;
};

/* Entity: Message */

export type ModuleQuoteMessage = {
  id: string;
  text: string;
  quote_id: string;
  admin_id: string;
  customer_id: string;
  item_id: string;
};
