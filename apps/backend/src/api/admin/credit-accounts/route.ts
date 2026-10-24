import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { CREDIT_ACCOUNT_MODULE } from "../../../modules/credit-account";
import type CreditAccountModuleService from "../../../modules/credit-account/service";
import { AdminCreateCreditAccountType } from "./validators";

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const creditAccountService =
    req.scope.resolve<CreditAccountModuleService>(CREDIT_ACCOUNT_MODULE);

  const { company_id, offset = 0, limit = 50 } = req.query as {
    company_id?: string;
    offset?: number;
    limit?: number;
  };

  const filter: Record<string, unknown> = {};
  if (company_id) filter.company_id = company_id;

  const [accounts, count] = await creditAccountService.listAndCountCreditAccounts(
    filter,
    { skip: offset, take: limit }
  );

  res.json({ credit_accounts: accounts, count });
};

export const POST = async (
  req: MedusaRequest<AdminCreateCreditAccountType>,
  res: MedusaResponse
) => {
  const creditAccountService =
    req.scope.resolve<CreditAccountModuleService>(CREDIT_ACCOUNT_MODULE);
  const body = req.validatedBody;

  // Aynı şirkete ikinci hesap oluşturulamaz: güncelleyerek döner (idempotent)
  const [existing] = await creditAccountService.listCreditAccounts({
    company_id: body.company_id,
  });

  const account = existing
    ? (
        await creditAccountService.updateCreditAccounts([
          {
            id: existing.id,
            credit_limit: Number(body.credit_limit),
            credit_days: body.credit_days,
            active: body.active,
          },
        ])
      )[0]
    : await creditAccountService.createCreditAccounts({
        ...body,
        credit_limit: Number(body.credit_limit),
      });

  res.json({ credit_account: account });
};
