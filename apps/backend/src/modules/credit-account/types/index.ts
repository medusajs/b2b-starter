export type CreateCreditAccountInput = {
  company_id: string;
  credit_limit?: string | number;
  credit_days?: number;
  currency_code?: string;
  active?: boolean;
};

export type UpdateCreditAccountInput = {
  credit_limit?: string | number;
  credit_days?: number;
  active?: boolean;
};

export type CreateCreditTransactionInput = {
  credit_account_id: string;
  type: "order" | "payment" | "adjustment";
  amount: string | number;
  order_id?: string | null;
  note?: string | null;
};
