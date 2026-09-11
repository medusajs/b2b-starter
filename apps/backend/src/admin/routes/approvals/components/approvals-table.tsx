import {
  DataTable,
  DataTableFilteringState,
  DataTablePaginationState,
  Heading,
  useDataTable,
} from "@medusajs/ui";
import { useMemo, useState } from "react";
import { useApprovals } from "../../../../admin/hooks/api";
import { useApprovalsTableColumns } from "./table/columns";
import { useApprovalsTableFilters } from "./table/filters";

const PAGE_SIZE = 50;

export const ApprovalsTable = () => {
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [filtering, setFiltering] = useState<DataTableFilteringState>({});
  const [search, setSearch] = useState("");

  const searchParams = useMemo(
    () => ({
      limit: pagination.pageSize,
      offset: pagination.pageIndex * pagination.pageSize,
      q: search || undefined,
      ...filtering,
    }),
    [pagination, search, filtering]
  );

  const { data, isPending } = useApprovals({
    ...searchParams,
    order: "-updated_at",
  });

  const columns = useApprovalsTableColumns();
  const filters = useApprovalsTableFilters();

  const table = useDataTable({
    data: data?.carts_with_approvals ?? [],
    columns,
    filters,
    rowCount: data?.count ?? 0,
    getRowId: (row) => row.id,
    isLoading: isPending,
    pagination: { state: pagination, onPaginationChange: setPagination },
    filtering: { state: filtering, onFilteringChange: setFiltering },
    search: { state: search, onSearchChange: setSearch },
  });

  return (
    <DataTable instance={table}>
      <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
        <Heading>Approvals</Heading>
        <div className="flex gap-2">
          <DataTable.FilterMenu tooltip="Filter" />
          <DataTable.Search placeholder="Search..." />
        </div>
      </DataTable.Toolbar>
      <DataTable.Table
        emptyState={{
          empty: {
            heading: "No approvals found",
            description: "There are currently no approvals.",
          },
        }}
      />
      <DataTable.Pagination />
    </DataTable>
  );
};
