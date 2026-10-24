import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261024141308 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "credit_account" drop constraint if exists "credit_account_company_id_unique";`);
    this.addSql(`create table if not exists "credit_account" ("id" text not null, "company_id" text not null, "credit_limit" numeric not null default 0, "balance" numeric not null default 0, "currency_code" text not null default 'try', "credit_days" integer not null default 30, "active" boolean not null default true, "raw_credit_limit" jsonb not null default '{"value":"0","precision":20}', "raw_balance" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "credit_account_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_credit_account_company_id_unique" ON "credit_account" ("company_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_credit_account_deleted_at" ON "credit_account" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "credit_transaction" ("id" text not null, "credit_account_id" text not null, "type" text check ("type" in ('order', 'payment', 'adjustment')) not null default 'order', "amount" numeric not null, "order_id" text null, "note" text null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "credit_transaction_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_credit_transaction_credit_account_id" ON "credit_transaction" ("credit_account_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_credit_transaction_deleted_at" ON "credit_transaction" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "credit_transaction" add constraint "credit_transaction_credit_account_id_foreign" foreign key ("credit_account_id") references "credit_account" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "credit_transaction" drop constraint if exists "credit_transaction_credit_account_id_foreign";`);

    this.addSql(`drop table if exists "credit_account" cascade;`);

    this.addSql(`drop table if exists "credit_transaction" cascade;`);
  }

}
