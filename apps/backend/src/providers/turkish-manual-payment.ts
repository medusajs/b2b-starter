import {
  AbstractPaymentProvider,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils";
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  BigNumberInput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  PaymentProviderContext,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types";

type Options = {
  /** "bank-transfer" | "cod" */
  mode: string;
};

/**
 * Elden yönetilen Türk ödeme sağlayıcıları:
 *  - bank-transfer: Havale / EFT — ödeme bankadan elle teyit edilir,
 *    admin Payment Capture ile tahsil edilir.
 *  - cod: Kapıda ödeme — teslimatta nakit/kart tahsil edilir.
 *
 * Tasarım: authorize anında "authorized" döner (sepet/checkout tamamlanır),
 * capture elle yapılır — böylece sipariş kaydı tahsilattan önce oluşur.
 */
class TurkishManualPaymentProvider extends AbstractPaymentProvider<Options> {
  static identifier = "tr_manual";

  protected constructor(container: Record<string, unknown>, readonly options: Options) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(container as any, options);
  }

  getIdentifier(): string {
    return (this.constructor as typeof TurkishManualPaymentProvider).identifier;
  }

  private get mode(): string {
    return this.options?.mode ?? "bank-transfer";
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const extra =
      this.mode === "bank-transfer"
        ? { instructions: "Sipariş sonrası havale/EFT ile firmamız hesabına ödeme yapınız. Ödemeniz teyit edildiğinde siparişiniz sevk edilir." }
        : { instructions: "Siparişiniz teslimatta nakit veya kredi kartı ile tahsil edilecektir." };
    return {
      id: `tr-${this.mode}-${Math.random().toString(36).slice(2, 10)}`,
      data: { ...extra, reference: input.context?.idempotency_key ?? null },
      status: PaymentSessionStatus.PENDING,
    };
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return { data: {} };
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: {} };
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    // Manual providers: sipariş oluştur, tahsilatı elle yap.
    return { status: PaymentSessionStatus.AUTHORIZED, data: { method: this.mode } };
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    return { data: { captured: true } };
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    return { data: {} };
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return { data: {} };
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: {} };
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    return { status: PaymentSessionStatus.AUTHORIZED };
  }

  async getWebhookActionAndData(
    data: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    return { action: PaymentActions.NOT_SUPPORTED };
  }
}

/**
 * Module-provider loader per Provider'ı `default.services` dizisinden alır.
 * Aynı sınıf iki ayrı options ile (havale/kapida) kaydedilir: `pp_tr_manual_havale`, `pp_tr_manual_kapida`.
 */
export default {
  services: [TurkishManualPaymentProvider],
};
