import { ApprovalStatusType, ApprovalType } from "./module";
import { QueryApproval, QueryApprovalStatus } from "./query";

/* Store */
export type StoreApprovalResponse = {
  approval: QueryApproval;
};

export type StoreApprovalsResponse = {
  approvals: QueryApproval[];
  count: number;
};

export type StoreCreateApproval = {
  cart_id: string;
  type: ApprovalType;
  created_by: string;
};

export type StoreUpdateApproval = {
  status: ApprovalStatusType;
  handled_by: string;
};

export type StoreApprovalStatus = QueryApprovalStatus;
