import { createSelectParams } from "@medusajs/medusa/api/utils/validators";
import { z } from "@medusajs/framework/zod";

export type StoreGetCreditAccountParamsType = z.infer<
  typeof StoreGetCreditAccountParams
>;
export const StoreGetCreditAccountParams = createSelectParams();

export type StoreCreateCreditOrderType = z.infer<typeof StoreCreateCreditOrder>;
export const StoreCreateCreditOrder = z
  .object({
    cart_id: z.string(),
    note: z.string().optional().nullable(),
  })
  .strict();
