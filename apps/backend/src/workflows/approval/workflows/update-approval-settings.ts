import { createWorkflow, WorkflowResponse } from "@medusajs/workflows-sdk";
import { ModuleUpdateApprovalSettings } from "@b2b-starter/types";
import { updateApprovalSettingsStep } from "../steps";

export const updateApprovalSettingsWorkflow = createWorkflow(
  "update-approval-settings",
  function (input: ModuleUpdateApprovalSettings) {
    return new WorkflowResponse(updateApprovalSettingsStep(input));
  }
);
