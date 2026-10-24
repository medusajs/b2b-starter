import { model } from "@medusajs/framework/utils";
import { CreditTransaction } from "./credit-transaction";

/**
 * Bayi (company) cari hesabı. Tüm tutarlar para biriminde alt birimde
 * (kuruş) saklanır: 100 = 1 TRY.
 */
export const CreditAccount = model.define("credit_account", {
  id: model.id({ prefix: "cacc" }).primaryKey(),
  company_id: model.text().unique(),
  // Maksimum açık borç limiti (vadeli ödeme üst sınırı), kuruş
  credit_limit: model.bigNumber().default(0),
  // Güncel açık borç (siparişler - tahsilatlar), kuruş
  balance: model.bigNumber().default(0),
  currency_code: model.text().default("try"),
  // Vadeli süre (gün) — sipariş sonrası vade
  credit_days: model.number().default(30),
  active: model.boolean().default(true),
  transactions: model.hasMany(() => CreditTransaction, {
    mappedBy: "credit_account",
  }),
});
