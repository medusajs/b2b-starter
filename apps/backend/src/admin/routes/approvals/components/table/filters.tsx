import { createDataTableFilterHelper } from "@medusajs/ui";
import { ApprovalStatusType } from "../../../../../types/approval";

const filterHelper = createDataTableFilterHelper<any>();

export const useApprovalsTableFilters = () => [
  filterHelper.accessor("status", {
    label: "Status",
    type: "select",
    options: [
      { label: "Pending", value: ApprovalStatusType.PENDING },
      { label: "Approved", value: ApprovalStatusType.APPROVED },
      { label: "Rejected", value: ApprovalStatusType.REJECTED },
    ],
  }),
];
