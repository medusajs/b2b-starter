import {
  DataTable,
  DataTablePaginationState,
  Heading,
  useDataTable,
} from "@medusajs/ui";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuotes } from "../../../../admin/hooks/api";
import { useQuotesTableColumns } from "./table/columns";

const PAGE_SIZE = 50;

export const QuotesTable = () => {
  const navigate = useNavigate();
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
    quotes = [],
    count = 0,
    isPending,
  } = useQuotes({
    ...searchParams,
    fields:
      "+draft_order.total,+draft_order.customer.email,*draft_order.customer.employee.company",
    order: "-created_at",
  });

  const columns = useQuotesTableColumns();

  const table = useDataTable({
    data: quotes,
    columns,
    rowCount: count,
    getRowId: (row) => row.id,
    isLoading: isPending,
    pagination: { state: pagination, onPaginationChange: setPagination },
    search: { state: search, onSearchChange: setSearch },
    onRowClick: (_event, row) => navigate(`/quotes/${row.id}`),
  });

  return (
    <DataTable instance={table}>
      <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
        <Heading>Quotes</Heading>
        <DataTable.Search placeholder="Search..." />
      </DataTable.Toolbar>
      <DataTable.Table
        emptyState={{
          empty: {
            heading: "No quotes found",
            description:
              "There are currently no quotes. Create one from the storefront.",
          },
        }}
      />
      <DataTable.Pagination />
    </DataTable>
  );
};
