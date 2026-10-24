import { QUOTE_MODULE } from "./src/modules/quote";
import { APPROVAL_MODULE } from "./src/modules/approval";
import { COMPANY_MODULE } from "./src/modules/company";
import { CREDIT_ACCOUNT_MODULE } from "./src/modules/credit-account";
import { Modules, loadEnv, defineConfig } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  modules: {
    [Modules.PAYMENT]: {
      resolve: "@medusajs/payment",
      options: {
        providers: [
          { resolve: "./src/providers/turkish-manual-payment", id: "havale", options: { mode: "bank-transfer" } },
          { resolve: "./src/providers/turkish-manual-payment", id: "kapida", options: { mode: "cod" } },
        ],
      },
    },
    [COMPANY_MODULE]: {
      resolve: "./modules/company",
    },
    [CREDIT_ACCOUNT_MODULE]: {
      resolve: "./modules/credit-account",
    },
    [QUOTE_MODULE]: {
      resolve: "./modules/quote",
    },
    [APPROVAL_MODULE]: {
      resolve: "./modules/approval",
    },
  },
});
