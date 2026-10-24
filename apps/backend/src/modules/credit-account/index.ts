import { Module } from "@medusajs/framework/utils";
import CreditAccountModuleService from "./service";

export const CREDIT_ACCOUNT_MODULE = "credit_account";

export default Module(CREDIT_ACCOUNT_MODULE, {
  service: CreditAccountModuleService,
});
