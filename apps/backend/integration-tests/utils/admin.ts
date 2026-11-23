import {
  IAuthModuleService,
  IUserModuleService,
} from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import jwt from "jsonwebtoken";

export const adminHeaders = {
  headers: {},
};

export const createAdminUser = async (adminHeaders, appContainer) => {
  const userModule: IUserModuleService = appContainer.resolve(Modules.USER);
  const authModule: IAuthModuleService = appContainer.resolve(Modules.AUTH);
  const user = await userModule.createUsers({
    first_name: "Admin",
    last_name: "User",
    email: "admin@medusa.js",
  });

  const authIdentity = await authModule.createAuthIdentities({
    provider_identities: [
      {
        provider: "emailpass",
        entity_id: "admin@medusa.js",
      },
    ],
    app_metadata: {
      user_id: user.id,
    },
  });

  const token = jwt.sign(
    {
      actor_id: user.id,
      actor_type: "user",
      auth_identity_id: authIdentity.id,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "1d",
    }
  );

  adminHeaders.headers["authorization"] = `Bearer ${token}`;

  return { user, authIdentity };
};

export const createStoreUser = async ({ api, storeHeaders, email = "test@email.com" }) => {
  const registerToken = (
    await api.post("/auth/customer/emailpass/register", {
      email,
      password: "password",
    })
  ).data.token;

  const customer = (
    await api.post(
      "/store/customers",
      {
        email,
      },
      {
        headers: {
          ...storeHeaders.headers,
          Authorization: `Bearer ${registerToken}`,
        },
      }
    )
  ).data.customer;

  const token = (
    await api.post("/auth/customer/emailpass", {
      email,
      password: "password",
    })
  ).data.token;

  return { customer, token };
};
