import { createDataTableColumnHelper } from "@medusajs/ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ProductCell, ProductHeader } from "../../../../../components";

const columnHelper = createDataTableColumnHelper<any>();

export const useManageItemsTableColumns = (currencyCode: string) => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.select(),
      columnHelper.display({
        id: "product",
        header: () => <ProductHeader />,
        cell: ({ row }) => <ProductCell product={row.original.product} />,
      }),
      columnHelper.accessor("sku", {
        header: t("fields.sku"),
        cell: ({ getValue }) => getValue() || "-",
      }),
      columnHelper.accessor("title", {
        header: t("fields.title"),
      }),
    ],
    [t, currencyCode]
  );
};
