import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { storeCreditAccountFields } from "./query-config";

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const customer_id = req.auth_context?.actor_id as string;

  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["employee.company.id"],
    filters: { id: customer_id },
  });

  const companyId = customer?.employee?.company?.id as string;
  if (!companyId) {
    return res.json({ credit_account: null, transactions: [] });
  }

  const {
    data: [account],
  } = await query.graph({
    entity: "credit_account",
    fields: storeCreditAccountFields,
    filters: { company_id: companyId },
  });

  if (!account) {
    return res.json({ credit_account: null, transactions: [] });
  }

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
    filters: { credit_account_id: account.id },
  });

  res.json({ credit_account: account, transactions });
};
