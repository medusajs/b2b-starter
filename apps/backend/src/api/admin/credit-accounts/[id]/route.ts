import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { CREDIT_ACCOUNT_MODULE } from "../../../../modules/credit-account";
import type CreditAccountModuleService from "../../../../modules/credit-account/service";
import { AdminUpdateCreditAccountType } from "../validators";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const creditAccountService =
    req.scope.resolve<CreditAccountModuleService>(CREDIT_ACCOUNT_MODULE);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const account = await creditAccountService.retrieveCreditAccount(id);

  const { data: transactions } = await query.graph({
    entity: "credit_transaction",
    fields: [
      "id",
      "type",
      "amount",
      "order_id",
      "note",
      "created_at",
      "credit_account_id",
    ],
    filters: { credit_account_id: id },
  });

  res.json({ credit_account: account, transactions });
};

export const POST = async (
  req: MedusaRequest<AdminUpdateCreditAccountType>,
  res: MedusaResponse
) => {
  const { id } = req.params;
  const creditAccountService =
    req.scope.resolve<CreditAccountModuleService>(CREDIT_ACCOUNT_MODULE);

  const before = await creditAccountService.retrieveCreditAccount(id);
  const { balance, ...updates } = req.validatedBody;

  // Açıkça verilen bakiye: tutarlılık için farkı bir düzeltme işlemi olarak
  // kaydediyoruz (bakiye = ledger işlem toplamı invariant'ı korunur).
  if (typeof balance !== "undefined") {
    const newBalance = Number(balance);
    const delta = newBalance - Number(before.balance);
    if (delta !== 0) {
      await creditAccountService.createCreditTransactions({
        credit_account_id: id,
        type: delta > 0 ? "order" : "payment",
        amount: delta,
        note: "Bakiye düzeltmesi",
      });
    }
  }

  const [account] = await creditAccountService.updateCreditAccounts([
    {
      id,
      ...(updates.credit_days !== undefined
        ? { credit_days: updates.credit_days }
        : {}),
      ...(updates.active !== undefined ? { active: updates.active } : {}),
      ...(updates.credit_limit !== undefined
        ? { credit_limit: Number(updates.credit_limit) }
        : {}),
      ...(typeof balance !== "undefined" ? { balance: Number(balance) } : {}),
    },
  ]);

  res.json({ credit_account: account });
};
