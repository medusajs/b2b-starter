import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { CREDIT_ACCOUNT_MODULE } from "../../../../../modules/credit-account";
import type CreditAccountModuleService from "../../../../../modules/credit-account/service";
import { AdminCreateCreditPaymentType } from "../../validators";

/**
 * Tahsilat kaydı: cari Hesap bakiyesini düşürür (borç azaltma).
 */
export const POST = async (
  req: MedusaRequest<AdminCreateCreditPaymentType>,
  res: MedusaResponse
) => {
  const { id } = req.params;
  const { amount, note } = req.validatedBody;
  const creditAccountService =
    req.scope.resolve<CreditAccountModuleService>(CREDIT_ACCOUNT_MODULE);

  const account = await creditAccountService.retrieveCreditAccount(id);

  const paymentAmount = Number(amount);
  if (!(paymentAmount > 0)) {
    return res
      .status(400)
      .json({ message: "Tahsilat tutarı 0'dan büyük olmalı." });
  }

  await creditAccountService.createCreditTransactions({
    credit_account_id: id,
    type: "payment",
    amount: -paymentAmount,
    note: note ?? "Tahsilat",
  });

  const [updated] = await creditAccountService.updateCreditAccounts([
    {
      id,
      balance: Math.max(0, Number(account.balance) - paymentAmount),
    },
  ]);

  res.json({ credit_account: updated });
};
