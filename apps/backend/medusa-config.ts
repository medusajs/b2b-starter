import { QUOTE_MODULE } from "./src/modules/quote";
import { APPROVAL_MODULE } from "./src/modules/approval";
import { COMPANY_MODULE } from "./src/modules/company";
import { loadEnv, defineConfig, Modules } from "@medusajs/framework/utils";

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
    [COMPANY_MODULE]: {
      resolve: "./modules/company",
    },
    [QUOTE_MODULE]: {
      resolve: "./modules/quote",
    },
    [APPROVAL_MODULE]: {
      resolve: "./modules/approval",
    },
    // Adyen is only registered when it's configured. Enable it in a region, for example from the Medusa Admin.
    ...(process.env.ADYEN_API_KEY
      ? {
          [Modules.PAYMENT]: {
            resolve: "@medusajs/medusa/payment",
            options: {
              providers: [
                {
                  resolve: "@medusajs/medusa/payment-adyen",
                  id: "adyen",
                  options: {
                    apiKey: process.env.ADYEN_API_KEY,
                    merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
                    hmacKey: process.env.ADYEN_HMAC_KEY,
                    environment: process.env.ADYEN_ENVIRONMENT,
                    liveEndpointUrlPrefix:
                      process.env.ADYEN_LIVE_ENDPOINT_URL_PREFIX,
                  },
                },
              ],
            },
          },
        }
      : {}),
  },
});
