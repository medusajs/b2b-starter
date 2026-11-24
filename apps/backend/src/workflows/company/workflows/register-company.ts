import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { ModuleCreateCompany } from "../../../types";
import { createEmployeesWorkflow } from "../../employee/workflows";
import { createCompaniesWorkflow } from "./create-companies";

export const registerCompanyWorkflow = createWorkflow(
  "register-company",
  function (input: { company: ModuleCreateCompany; customerId: string }) {
    const companies = createCompaniesWorkflow.runAsStep({
      input: transform(input, ({ company }) => [company]),
    });

    const founder = createEmployeesWorkflow.runAsStep({
      input: transform({ companies, input }, ({ companies, input }) => ({
        employeeData: {
          company_id: companies[0].id,
          customer_id: input.customerId,
          is_admin: true,
          spending_limit: 0,
        },
        customerId: input.customerId,
      })),
    });

    return new WorkflowResponse({ companies, founder });
  }
);
