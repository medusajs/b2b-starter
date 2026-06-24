import { model } from "@medusajs/framework/utils";

export const Quote = model.define("quote", {
  id: model.id({ prefix: "quo" }).primaryKey(),
  status: model
    .enum([
      "pending_merchant",
      "pending_customer",
      "accepted",
      "customer_rejected",
      "merchant_rejected",
    ])
    .default("pending_merchant"),
  customer_id: model.text(),
  draft_order_id: model.text(),
  order_change_id: model.text(),
  cart_id: model.text(),
  messages: model.hasMany(() => Message),
});

export const Message = model.define("message", {
  id: model.id({ prefix: "mess" }).primaryKey(),
  text: model.text(),
  item_id: model.text().nullable(),
  admin_id: model.text().nullable(),
  customer_id: model.text().nullable(),
  quote: model.belongsTo(() => Quote, { mappedBy: "messages" }),
});
