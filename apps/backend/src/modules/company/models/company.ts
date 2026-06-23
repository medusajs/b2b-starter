import { model } from "@medusajs/framework/utils";

export const Company = model.define("company", {
  id: model
    .id({
      prefix: "comp",
    })
    .primaryKey(),
  name: model.text(),
  email: model.text(),
  phone: model.text().nullable(),
  address: model.text().nullable(),
  city: model.text().nullable(),
  state: model.text().nullable(),
  zip: model.text().nullable(),
  country: model.text().nullable(),
  logo_url: model.text().nullable(),
  currency_code: model.text().nullable(),
  spending_limit_reset_frequency: model
    .enum(["never", "daily", "weekly", "monthly", "yearly"])
    .default("monthly"),
  employees: model.hasMany(() => Employee),
});

export const Employee = model.define("employee", {
  id: model
    .id({
      prefix: "emp",
    })
    .primaryKey(),
  spending_limit: model.bigNumber().default(0),
  is_admin: model.boolean().default(false),
  company: model.belongsTo(() => Company, {
    mappedBy: "employees",
  }),
});
