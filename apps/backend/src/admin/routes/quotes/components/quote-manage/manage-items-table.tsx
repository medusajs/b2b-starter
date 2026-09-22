import {
  DataTable,
  DataTablePaginationState,
  DataTableRowSelectionState,
  useDataTable,
} from "@medusajs/ui";
import { useMemo, useState } from "react";
import { useVariants } from "../../../../hooks/api";
import { useManageItemsTableColumns } from "./table/columns";

const PAGE_SIZE = 50;

type ManageItemsTableProps = {
  onSelectionChange: (ids: string[]) => void;
  currencyCode: string;
};

export const ManageItemsTable = ({
  onSelectionChange,
  currencyCode,
}: ManageItemsTableProps) => {
  const [rowSelection, setRowSelection] = useState<DataTableRowSelectionState>(
    {}
  );
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [search, setSearch] = useState("");

  const searchParams = useMemo(
    () => ({
      limit: pagination.pageSize,
      offset: pagination.pageIndex * pagination.pageSize,
      q: search || undefined,
    }),
    [pagination, search]
  );

  const {
    variants = [],
    count = 0,
    isPending,
  } = useVariants({
    ...searchParams,
    fields: "*inventory_items.inventory.location_levels,+inventory_quantity",
  });

  const columns = useManageItemsTableColumns(currencyCode);

  const table = useDataTable({
    data: variants,
    columns,
    rowCount: count,
    getRowId: (row) => row.id,
    isLoading: isPending,
    pagination: { state: pagination, onPaginationChange: setPagination },
    search: { state: search, onSearchChange: setSearch },
    rowSelection: {
      state: rowSelection,
      onRowSelectionChange: (state) => {
        setRowSelection(state);
        onSelectionChange(Object.keys(state));
      },
    },
  });

  return (
    <DataTable instance={table}>
      <DataTable.Toolbar className="flex justify-end">
        <DataTable.Search placeholder="Search..." />
      </DataTable.Toolbar>
      <DataTable.Table />
      <DataTable.Pagination />
    </DataTable>
  );
};
