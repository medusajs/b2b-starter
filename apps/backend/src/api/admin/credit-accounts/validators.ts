import { createSelectParams } from "@medusajs/medusa/api/utils/validators";
import { z } from "@medusajs/framework/zod";

export type AdminGetCreditAccountParamsType = z.infer<
  typeof AdminGetCreditAccountParams
>;
export const AdminGetCreditAccountParams = createSelectParams();

export type AdminCreateCreditAccountType = z.infer<
  typeof AdminCreateCreditAccount
>;
export const AdminCreateCreditAccount = z
  .object({
    company_id: z.string(),
    credit_limit: z.union([z.string(), z.number()]).default(0),
    credit_days: z.number().int().default(30),
    currency_code: z.string().default("try"),
    active: z.boolean().default(true),
  })
  .strict();

export type AdminUpdateCreditAccountType = z.infer<
  typeof AdminUpdateCreditAccount
>;
export const AdminUpdateCreditAccount = z
  .object({
    credit_limit: z.union([z.string(), z.number()]).optional(),
    credit_days: z.number().int().optional(),
    active: z.boolean().optional(),
    // Bakiye düzeltmesi (ör. başlangıç bakiyesi, elle düzeltme).
    // Ledger tutarlılığı için fark bir "adjustment" işlemi olarak kaydedilir.
    balance: z.union([z.string(), z.number()]).optional(),
  })
  .strict();

export type AdminCreateCreditPaymentType = z.infer<
  typeof AdminCreateCreditPayment
>;
export const AdminCreateCreditPayment = z
  .object({
    amount: z.union([z.string(), z.number()]),
    note: z.string().optional().nullable(),
  })
  .strict();
