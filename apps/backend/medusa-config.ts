import { QUOTE_MODULE } from "./src/modules/quote";
import { APPROVAL_MODULE } from "./src/modules/approval";
import { COMPANY_MODULE } from "./src/modules/company";
import { loadEnv, defineConfig } from "@medusajs/framework/utils";

try {
  loadEnv(process.env.NODE_ENV || "development", process.cwd());
} catch (e) {
  // loadEnv may fail during build if .env doesn't exist, that's OK
  // Runtime env vars will be used when the server starts
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL || "postgres://localhost/medusa",
    http: {
      storeCors: process.env.STORE_CORS || "*",
      adminCors: process.env.ADMIN_CORS || "*",
      authCors: process.env.AUTH_CORS || "*",
      jwtSecret: process.env.JWT_SECRET || "build-time-secret",
      cookieSecret: process.env.COOKIE_SECRET || "build-time-secret",
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
  },
});
