import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { SearchInput } from "@/components/ui/SearchInput";
import { transactionService } from "@/services/transaction.service";

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "initialized", label: "Initialized" },
  { value: "pending", label: "Pending" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
];

const purposeOptions = [
  { value: "", label: "All purposes" },
  { value: "order_payment", label: "Order payments" },
  { value: "affiliate_withdrawal_payout", label: "Withdrawal payouts" },
];

const purposeLabel = {
  order_payment: "Order payment",
  affiliate_withdrawal_payout: "Withdrawal payout",
};

const statusClass = {
  initialized: "text-gray-600",
  pending: "text-amber-700",
  success: "text-emerald-700",
  failed: "text-red-700",
};

const formatDate = (value) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const money = (value) => `GHS ${Number(value || 0).toFixed(2)}`;

export default function Transactions() {
  const [status, setStatus] = useState("");
  const [purpose, setPurpose] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      page,
      per_page: 25,
      ...(status ? { status } : {}),
      ...(purpose ? { purpose } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [page, purpose, search, status]
  );

  const transactionsQuery = useQuery({
    queryKey: ["transactions", params],
    queryFn: () => transactionService.getTransactions(params),
  });

  const transactions = transactionsQuery.data?.data || [];
  const meta = transactionsQuery.data?.meta || {};

  const updateFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 montserrat">
      <div className="w-full p-4 sm:p-6 space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">Transactions</h1>
            <p className="text-sm text-gray-600">
              Track order payments and affiliate withdrawal payouts.
            </p>
          </div>
          <Button
            auto
            className="h-[42px] gap-2 rounded-none"
            onClick={() => transactionsQuery.refetch()}
            isLoading={transactionsQuery.isFetching}
            loadingText="Refreshing"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(260px,1fr)_180px_180px]">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Search</label>
            <SearchInput
              value={search}
              onChange={updateFilter(setSearch)}
              placeholder="Search user, order or reference"
              className="w-full!"
            />
          </div>
            <Select
              label="Purpose"
              value={purpose}
              onChange={updateFilter(setPurpose)}
              options={purposeOptions}
              containerClassName="min-w-0"
              selectClassName="py-2.5! text-sm! rounded-xl!"
            />
            <Select
              label="Status"
              value={status}
              onChange={updateFilter(setStatus)}
              options={statusOptions}
              containerClassName="min-w-0"
              selectClassName="py-2.5! text-sm! rounded-xl!"
            />
        </div>

        {transactionsQuery.isLoading ? (
          <TableSkeleton rows={8} columns={5} />
        ) : (
          <div className="w-full overflow-x-auto bg-white">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <Th>User</Th>
                  <Th>Purpose</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => {
                    const attrs = transaction.attributes || {};
                    const isDebit = attrs.direction === "debit";
                    return (
                      <tr key={transaction.id} className="border-b border-gray-100">
                        <Td>
                          <div className="font-medium text-gray-900">{attrs.user_name || "Customer"}</div>
                          <div className="text-xs text-gray-500">{attrs.user_email || "—"}</div>
                        </Td>
                        <Td>
                          <div className="inline-flex items-center gap-2 text-gray-900">
                            {isDebit ? (
                              <ArrowUpRight className="h-4 w-4 text-red-600" />
                            ) : (
                              <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                            )}
                            <span>{purposeLabel[attrs.purpose] || attrs.purpose}</span>
                          </div>
                          <div className="ml-6 text-xs capitalize text-gray-500">{attrs.direction}</div>
                        </Td>
                        <Td className="font-medium text-gray-900">{money(attrs.amount)}</Td>
                        <Td>
                          <span className={`text-xs font-semibold uppercase ${statusClass[attrs.status] || "text-gray-600"}`}>
                            {attrs.status}
                          </span>
                        </Td>
                        <Td>
                          <div>{formatDate(attrs.created_at)}</div>
                          <div className="text-xs text-gray-500">Processed: {formatDate(attrs.processed_at)}</div>
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {meta.total_pages > 1 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Page {meta.current_page} of {meta.total_pages} · {meta.total_count} transactions
            </p>
            <div className="flex gap-2">
              <Button
                auto
                className="rounded-none bg-gray-900 px-3"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
              >
                Previous
              </Button>
              <Button
                auto
                className="rounded-none bg-gray-900 px-3"
                disabled={page >= meta.total_pages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const Th = ({ children }) => (
  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">{children}</th>
);

const Td = ({ children, className = "" }) => (
  <td className={`px-4 py-3 align-top text-gray-700 ${className}`}>{children}</td>
);
