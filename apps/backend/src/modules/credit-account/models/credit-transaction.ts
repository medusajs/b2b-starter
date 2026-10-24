import { model } from "@medusajs/framework/utils";
import { CreditAccount } from "./credit-account";

/**
 * Cari hesap hareketi.
 * - order:  vadeli siparişte borç artışı (amount > 0)
 * - payment: tahsilat, borç azalışı (amount > 0 saklanır, yön: financial_status)
 * - adjustment: manuel düzeltme (borç artışı)
 */
export const CreditTransaction = model.define("credit_transaction", {
  id: model.id({ prefix: "ctx" }).primaryKey(),
  credit_account: model.belongsTo(() => CreditAccount, {
    mappedBy: "transactions",
  }),
  type: model.enum(["order", "payment", "adjustment"]).default("order"),
  // Kuruş cinsinden pozitif tutar
  amount: model.bigNumber(),
  order_id: model.text().nullable(),
  note: model.text().nullable(),
});
