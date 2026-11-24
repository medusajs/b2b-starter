import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export const getCompanyMembership = async (req: AuthenticatedMedusaRequest) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: [customer] } = await query.graph({
    entity: "customer",
    fields: ["employee.company_id", "employee.is_admin"],
    filters: { id: req.auth_context.actor_id },
  });

  return customer?.employee;
};

export const ensureCompanyAccess = (adminRequired = false) =>
  async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    const employee = await getCompanyMembership(req);
    if (
      !employee?.company_id ||
      employee.company_id !== req.params.id ||
      (adminRequired && !employee.is_admin)
    ) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    next();
  };
