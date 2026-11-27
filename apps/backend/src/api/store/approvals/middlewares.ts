import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  authenticate,
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";
import { getCompanyMembership } from "../../middlewares/ensure-company-access";
import { ApprovalType } from "../../../types/approval";
import { approvalTransformQueryConfig } from "./query-config";
import { StoreGetApprovals, StoreUpdateApproval } from "./validators";

const ensureCompanyAdmin = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (!(await getCompanyMembership(req))?.is_admin) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  next();
};

const ensureApprovalType = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const { id } = req.params;

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [approval],
  } = await query.graph({
    entity: "approval",
    fields: ["type", "cart.company.id", "cart.customer.employee.company_id"],
    filters: { id },
  });

  if (!approval) {
    res.status(404).json({ message: "Approval not found" });
    return;
  }

  const approvalType = approval.type as unknown as ApprovalType;

  const employee = await getCompanyMembership(req);
  if (
    approvalType !== ApprovalType.ADMIN ||
    !employee?.company_id ||
    employee.company_id !== approval.cart?.company?.id ||
    employee.company_id !== approval.cart?.customer?.employee?.company_id
  ) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  next();
};

export const storeApprovalsMiddlewares: MiddlewareRoute[] = [
  {
    method: "ALL",
    matcher: "/store/approvals*",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      ensureCompanyAdmin,
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/approvals",
    middlewares: [
      validateAndTransformQuery(
        StoreGetApprovals,
        approvalTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/approvals/:id",
    middlewares: [
      ensureApprovalType,
      validateAndTransformBody(StoreUpdateApproval),
    ],
  },
];
