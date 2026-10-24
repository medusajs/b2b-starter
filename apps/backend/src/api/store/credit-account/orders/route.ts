import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  completeCartWorkflow,
  createPaymentCollectionForCartWorkflow,
  createPaymentSessionsWorkflow,
} from "@medusajs/core-flows";
import { CREDIT_ACCOUNT_MODULE } from "../../../../modules/credit-account";
import type CreditAccountModuleService from "../../../../modules/credit-account/service";
import { StoreCreateCreditOrderType } from "./../validators";

/**
 * Vadeli (cari hesap) sipariş yerleştirme.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateCreditOrderType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const creditAccountService =
    req.scope.resolve<CreditAccountModuleService>(CREDIT_ACCOUNT_MODULE);
  const customer_id = req.auth_context?.actor_id as string;
  const { cart_id, note } = req.validatedBody;

  // 1) Müşteri → şirket
  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["employee.company.id", "email"],
    filters: { id: customer_id },
  });
  const companyId = customer?.employee?.company?.id as string;
  if (!companyId) {
    return res.status(403).json({
      message: "Cari hesap siparişi yalnızca onaylı bayi hesapları içindir.",
    });
  }

  // 2) Sepet kontrolü
  const {
    data: [cart],
  } = await query.graph({
    entity: "cart",
    fields: ["id", "email", "customer_id", "currency_code", "total", "completed_at"],
    filters: { id: cart_id },
  });
  if (!cart || cart.customer_id !== customer_id || cart.completed_at) {
    return res.status(400).json({ message: "Geçersiz sepet." });
  }

  // 3) Cari hesap
  const [account] = await creditAccountService.listCreditAccounts({
    company_id: companyId,
  });
  if (!account) {
    return res.status(400).json({
      message: "Bu bayi hesabında cari hesap tanımlı değil. Lütfen bayi yönetiminizle görüşün.",
    });
  }
  if (!account.active) {
    return res.status(400).json({ message: "Cari hesap pasif durumda." });
  }
  if (account.currency_code !== cart.currency_code) {
    return res.status(400).json({
      message: `Para birimi uyuşmazlığı: cari hesap ${account.currency_code}, sepet ${cart.currency_code}.`,
    });
  }

  // 4) Limit kontrolü (kuruş)
  const cartTotal = Number(cart.total ?? 0);
  const available = Number(account.credit_limit) - Number(account.balance);
  if (cartTotal > available) {
    return res.status(400).json({
      message:
        "Vade limiti yetersiz. Limit: " +
        account.credit_limit +
        ", kullanılabilir: " +
        available,
      credit_limit: account.credit_limit,
      balance: account.balance,
      available,
    });
  }

  // 5) Vadeli ödeme: sistem ödeme sağlayıcısı üzerinden ödeme koleksiyonu
  // (order'ın tamamlanabilmesi için sepetin bir ödeşmesi olmalı; cari borç
  // zaten alttaki ledger adımında kaydedilir, tahsilat admin'den yapılır)
  const { result: paymentCollection } = await
    createPaymentCollectionForCartWorkflow(req.scope).run({
      input: { cart_id },
    });
  await createPaymentSessionsWorkflow(req.scope).run({
    input: {
      payment_collection_id: paymentCollection.id,
      provider_id: "pp_system_default",
      customer_id,
      data: { payment_method: "vadeli_cari", credit_account_id: account.id },
    },
  });

  // 6) Sipariş oluşturma
  const { result } = await completeCartWorkflow(req.scope).run({
    input: { id: cart_id },
  });
  const orderId = result.id as string;

  // 7) Cari ledger: borç ekle
  await creditAccountService.createCreditTransactions({
    credit_account_id: account.id,
    type: "order",
    amount: cartTotal,
    order_id: orderId,
    note:
      note ??
      `Vadeli sipariş #${orderId} (vade ${account.credit_days} gün)`,
  });
  await creditAccountService.updateCreditAccounts([
    { id: account.id, balance: Number(account.balance) + cartTotal },
  ]);

  const updated = await creditAccountService.retrieveCreditAccount(account.id);

  res.json({
    order_id: orderId,
    credit_account: updated,
  });
};
