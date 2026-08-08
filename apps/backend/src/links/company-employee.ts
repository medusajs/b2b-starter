import { defineLink } from "@medusajs/framework/utils";
import CompanyModule from "../modules/company";

export default defineLink(
  CompanyModule.linkable.company,
  {
    linkable: CompanyModule.linkable.employee,
    isList: true,
  }
);
