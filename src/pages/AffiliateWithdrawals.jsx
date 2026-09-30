import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreVertical, RefreshCw } from "lucide-react";
import { affiliateService } from "@/services/affiliate.service";
import { useToast } from "@/hooks/useToast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import Select from "@/components/ui/Select";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { useAuthContext } from "@/hooks/useAuthContext";
import { getUserRole } from "@/utils/roleGuard";

const statusVariant = {
  pending: "warning",
  approved: "success",
  rejected: "error",
  paid: "success",
  cancelled: "still",
};

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "paid", label: "Paid" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const formatDate = (value) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const money = (value) => `GHS ${Number(value || 0).toFixed(2)}`;

export default function AffiliateWithdrawals() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const isSuperAdmin = getUserRole(user) === "SUPER_ADMIN";
  const [openActionsId, setOpenActionsId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [status, setStatus] = useState("");
  const actionsMenuRef = useRef(null);

  useEffect(() => {
    if (!openActionsId) return undefined;

    const handleClickOutside = (event) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        setOpenActionsId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openActionsId]);

  const withdrawalsQuery = useQuery({
    queryKey: ["affiliate-withdrawals", status],
    queryFn: () => affiliateService.getWithdrawals(status ? { status } : {}),
  });

  const withdrawals = withdrawalsQuery.data?.data || [];

  const invalidateWithdrawals = () => {
    queryClient.invalidateQueries({ queryKey: ["affiliate-withdrawals"] });
  };

  const approveWithdrawalMutation = useMutation({
    mutationFn: affiliateService.approveWithdrawal,
    onSuccess: () => {
      toast.success("Withdrawal Approved", "The request is ready for Paystack transfer.");
      invalidateWithdrawals();
    },
    onError: (error) => {
      toast.error("Approval Failed", error.response?.data?.error || "Could not approve withdrawal");
    },
  });

  const rejectWithdrawalMutation = useMutation({
    mutationFn: ({ id, reason }) => affiliateService.rejectWithdrawal(id, reason),
    onSuccess: () => {
      toast.success("Withdrawal Rejected", "The affiliate balance reservation has been released.");
      invalidateWithdrawals();
    },
    onError: (error) => {
      toast.error("Rejection Failed", error.response?.data?.error || "Could not reject withdrawal");
    },
  });

  const payWithdrawalMutation = useMutation({
    mutationFn: affiliateService.payWithdrawal,
    onSuccess: () => {
      toast.success("Transfer Initiated", "Paystack is processing the MoMo disbursement.");
      invalidateWithdrawals();
    },
    onError: (error) => {
      toast.error("Transfer Failed", error.response?.data?.error || "Could not initiate transfer");
    },
  });

  const isActionLoading =
    approveWithdrawalMutation.isPending ||
    rejectWithdrawalMutation.isPending ||
    payWithdrawalMutation.isPending;

  const actionCopy = {
    approve: {
      title: "Approve withdrawal",
      description: "This will approve the withdrawal and keep the amount reserved for payout.",
      confirmText: "Approve",
      variant: "success",
    },
    pay: {
      title: "Pay withdrawal",
      description: "This will initiate the MoMo disbursement through Paystack.",
      confirmText: "Pay",
      variant: "success",
    },
    reject: {
      title: "Reject withdrawal",
      description: "This will reject the request and release the reserved affiliate balance.",
      confirmText: "Reject",
      variant: "danger",
    },
  };

  const requestAction = (action, withdrawal) => {
    setOpenActionsId(null);
    setConfirmAction({ action, withdrawal });
  };

  const runConfirmedAction = () => {
    if (!confirmAction) return;

    const { action, withdrawal } = confirmAction;
    if (action === "approve") {
      approveWithdrawalMutation.mutate(withdrawal.id, {
        onSuccess: () => setConfirmAction(null),
      });
    } else if (action === "pay") {
      payWithdrawalMutation.mutate(withdrawal.id, {
        onSuccess: () => setConfirmAction(null),
      });
    } else if (action === "reject") {
      rejectWithdrawalMutation.mutate(
        { id: withdrawal.id, reason: "Rejected by admin." },
        { onSuccess: () => setConfirmAction(null) }
      );
    }
  };

  return (
    <div className="bg-gray-50 montserrat min-h-screen">
      <div className="w-full p-4 sm:p-6 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">Withdrawals</h1>
            <p className="text-sm text-gray-600">
              Review affiliate payout requests and filter by status.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Select
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={statusOptions}
              containerClassName="min-w-52"
              selectClassName="py-2.5!"
            />
            <Button
              auto
              className="gap-2"
              onClick={() => withdrawalsQuery.refetch()}
              isLoading={withdrawalsQuery.isFetching}
              loadingText="Refreshing"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh payouts
            </Button>
          </div>
        </div>

        {withdrawalsQuery.isLoading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : (
          <div className="w-full overflow-x-auto bg-white">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <Th>Affiliate</Th>
                  <Th>Amount</Th>
                  <Th>Payout</Th>
                  <Th>Status</Th>
                  <Th>Requested</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                      No withdrawals found.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((withdrawal) => {
                    const attrs = withdrawal.attributes || {};
                    const payout = attrs.payout_details || {};
                    return (
                      <tr key={withdrawal.id} className="border-b border-gray-100">
                        <Td>
                          <div className="font-medium text-gray-900">{attrs.affiliate_name || "Affiliate"}</div>
                          <div className="text-xs text-gray-500">{attrs.affiliate_email}</div>
                          <div className="text-xs text-gray-500">{attrs.affiliate_code}</div>
                        </Td>
                        <Td className="font-semibold text-gray-900">{money(attrs.amount)}</Td>
                        <Td>
                          <div className="capitalize">{payout.provider || "—"}</div>
                          <div className="text-xs text-gray-500">{payout.account_name || "—"}</div>
                          <div className="text-xs text-gray-500">{payout.phone_number || "—"}</div>
                        </Td>
                        <Td>
                          <Badge variant={statusVariant[attrs.status] || "still"} className="w-24 justify-center">
                            {attrs.status}
                          </Badge>
                        </Td>
                        <Td>{formatDate(attrs.requested_at)}</Td>
                        <Td>
                          <div
                            ref={openActionsId === withdrawal.id ? actionsMenuRef : null}
                            className="relative inline-flex justify-end"
                          >
                            <button
                              type="button"
                              onClick={() => setOpenActionsId(openActionsId === withdrawal.id ? null : withdrawal.id)}
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center text-gray-600 hover:bg-gray-100"
                              title="Withdrawal actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {openActionsId === withdrawal.id && (
                              <div className="absolute right-0 top-9 z-20 w-36 bg-white py-1 text-left shadow-lg">
                                {isSuperAdmin && attrs.status === "pending" && (
                                  <button
                                    type="button"
                                    onClick={() => requestAction("approve", withdrawal)}
                                    className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    Approve
                                  </button>
                                )}
                                {attrs.status === "approved" && (
                                  <button
                                    type="button"
                                    onClick={() => requestAction("pay", withdrawal)}
                                    className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    Pay
                                  </button>
                                )}
                                {["pending", "approved"].includes(attrs.status) && (
                                  <button
                                    type="button"
                                    onClick={() => requestAction("reject", withdrawal)}
                                    className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                  >
                                    Reject
                                  </button>
                                )}
                                {!["pending", "approved"].includes(attrs.status) && (
                                  <div className="px-4 py-2 text-sm text-gray-500">
                                    No actions
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ConfirmModal
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        onConfirm={runConfirmedAction}
        title={actionCopy[confirmAction?.action]?.title}
        description={actionCopy[confirmAction?.action]?.description}
        confirmText={actionCopy[confirmAction?.action]?.confirmText}
        variant={actionCopy[confirmAction?.action]?.variant}
        isLoading={isActionLoading}
      />
    </div>
  );
}

const Th = ({ children }) => (
  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">{children}</th>
);

const Td = ({ children, className = "" }) => (
  <td className={`px-4 py-3 align-top text-gray-700 ${className}`}>{children}</td>
);
