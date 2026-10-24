import { MedusaService } from "@medusajs/framework/utils";
import { CreditAccount, CreditTransaction } from "./models";

class CreditAccountModuleService extends MedusaService({
  CreditAccount,
  CreditTransaction,
}) {
  /**
   * Cari hesapta kalan kullanılabilir vade limiti (kuruş).
   */
  async availableCredit(creditAccountId: string): Promise<number> {
    const account = await this.retrieveCreditAccount(creditAccountId);
    return Number(account.credit_limit) - Number(account.balance);
  }
}

export default CreditAccountModuleService;
