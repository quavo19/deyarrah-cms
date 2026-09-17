import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Handshake,
  PauseCircle,
  RefreshCw,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";
import { affiliateService } from "@/services/affiliate.service";
import { useToast } from "@/hooks/useToast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import CenterModal from "@/components/ui/CenterModal";
import Input from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import Select from "@/components/ui/Select";
import TableSkeleton from "@/components/ui/TableSkeleton";
import Textarea from "@/components/ui/Textarea";

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

const statusVariant = {
  pending: "warning",
  approved: "success",
  rejected: "error",
  suspended: "still",
};

const tableStatusLabel = (attrs = {}) => {
  if (attrs.status === "pending") return "Pending";
  return attrs.status_label || attrs.status || "—";
};

const formatDate = (value) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const money = (value) => `GHS ${Number(value || 0).toFixed(2)}`;

const Affiliates = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reviewModal, setReviewModal] = useState({
    open: false,
    application: null,
  });
  const [rejectReason, setRejectReason] = useState("");

  const params = useMemo(
    () => ({
      status: status || undefined,
      search: search || undefined,
      page,
      per_page: 25,
    }),
    [page, search, status]
  );

  const applicationsQuery = useQuery({
    queryKey: ["affiliate-applications", params],
    queryFn: () => affiliateService.getApplications(params),
  });

  const applications = applicationsQuery.data?.data || [];
  const meta = applicationsQuery.data?.meta || {};
  const selectedApplication = reviewModal.application;
  const selectedAttrs = selectedApplication?.attributes || {};

  const closeReviewModal = () => {
    setReviewModal({ open: false, application: null });
    setRejectReason("");
  };

  const openReviewModal = (application) => {
    setReviewModal({ open: true, application });
    setRejectReason(application?.attributes?.rejection_reason || "");
  };

  const invalidateApplications = () => {
    queryClient.invalidateQueries({ queryKey: ["affiliate-applications"] });
  };

  const approveMutation = useMutation({
    mutationFn: affiliateService.approveApplication,
    onSuccess: () => {
      toast.success(
        "Affiliate Approved",
        "The applicant can now use affiliate features."
      );
      closeReviewModal();
      invalidateApplications();
    },
    onError: (error) => {
      toast.error(
        "Approval Failed",
        error.response?.data?.error || "Could not approve affiliate"
      );
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) =>
      affiliateService.rejectApplication(id, reason),
    onSuccess: () => {
      toast.success(
        "Application Rejected",
        "The applicant can reapply after 2 weeks."
      );
      closeReviewModal();
      invalidateApplications();
    },
    onError: (error) => {
      toast.error(
        "Rejection Failed",
        error.response?.data?.error || "Could not reject affiliate"
      );
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }) =>
      affiliateService.suspendApplication(id, reason),
    onSuccess: () => {
      toast.success(
        "Affiliate Suspended",
        "Affiliate tracking, commissions, and withdrawals are now disabled."
      );
      closeReviewModal();
      invalidateApplications();
    },
    onError: (error) => {
      toast.error(
        "Suspension Failed",
        error.response?.data?.error || "Could not suspend affiliate"
      );
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: affiliateService.reactivateApplication,
    onSuccess: () => {
      toast.success(
        "Affiliate Reactivated",
        "Affiliate access and commission tracking are active again."
      );
      closeReviewModal();
      invalidateApplications();
    },
    onError: (error) => {
      toast.error(
        "Reactivation Failed",
        error.response?.data?.error || "Could not reactivate affiliate"
      );
    },
  });

  const handleApprove = () => {
    if (!selectedApplication) return;
    approveMutation.mutate(selectedApplication.id);
  };

  const handleReject = () => {
    if (!selectedApplication) return;
    rejectMutation.mutate({
      id: selectedApplication.id,
      reason: rejectReason.trim() || "Application denied by admin.",
    });
  };

  const handleSuspend = () => {
    if (!selectedApplication) return;
    suspendMutation.mutate({
      id: selectedApplication.id,
      reason: rejectReason.trim() || "Affiliate suspended by admin.",
    });
  };

  const handleReactivate = () => {
    if (!selectedApplication) return;
    reactivateMutation.mutate(selectedApplication.id);
  };

  return (
    <div className="bg-gray-50 montserrat min-h-screen">
      <div className="w-full p-4 sm:p-6 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-gray-200">
              <Handshake className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                Affiliate Requests
              </h1>
              <p className="text-sm text-gray-600">
                Review applications, approve qualified affiliates, or deny
                requests with a reason.
              </p>
            </div>
          </div>
          <Button
            auto
            className="gap-2"
            onClick={() => applicationsQuery.refetch()}
            isLoading={applicationsQuery.isFetching}
            loadingText="Refreshing"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_1fr]">
          <Select
            label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            options={statusOptions}
            selectClassName="py-2.5!"
          />
          <Input
            label="Search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            icon={<Search />}
            placeholder="Name, email, phone, affiliate code"
          />
        </div>

        {applicationsQuery.isLoading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {applications.length === 0 ? (
                <EmptyState />
              ) : (
                applications.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onOpen={() => openReviewModal(application)}
                  />
                ))
              )}
            </div>

            <div className="hidden md:block w-full overflow-x-auto bg-white">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <Th>Applicant</Th>
                    <Th>Audience</Th>
                    <Th>Channels</Th>
                    <Th>Status</Th>
                    <Th>Submitted</Th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        No affiliate requests found.
                      </td>
                    </tr>
                  ) : (
                    applications.map((application) => {
                      const attrs = application.attributes || {};
                      return (
                        <tr
                          key={application.id}
                          onClick={() => openReviewModal(application)}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        >
                          <Td>
                            <div className="font-medium text-gray-900">
                              {attrs.full_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {attrs.email}
                            </div>
                            <div className="text-xs text-gray-500">
                              {attrs.phone}
                            </div>
                          </Td>
                          <Td>
                            <div>
                              {Number(
                                attrs.audience_size || 0
                              ).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {attrs.content_niche}
                            </div>
                          </Td>
                          <Td className="max-w-[260px]">
                            {(attrs.promotion_channels || []).join(", ") || "—"}
                          </Td>
                          <Td>
                            <Badge
                              variant={statusVariant[attrs.status] || "still"}
                              className="w-24 justify-center"
                            >
                              {tableStatusLabel(attrs)}
                            </Badge>
                          </Td>
                          <Td>{formatDate(attrs.created_at)}</Td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              meta={meta}
              page={page}
              onPageChange={setPage}
              isLoading={applicationsQuery.isFetching}
              className="mt-4"
            />
          </>
        )}
      </div>

      <CenterModal
        open={reviewModal.open}
        onClose={closeReviewModal}
        heading={
          selectedAttrs.full_name
            ? `Review ${selectedAttrs.full_name}`
            : "Review affiliate request"
        }
        description="Inspect the request and update its status."
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        {selectedApplication && (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-gray-500">{selectedAttrs.email}</p>
                <p className="text-sm text-gray-500">{selectedAttrs.phone}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Code: {selectedAttrs.affiliate_code || "—"}
                </p>
              </div>
              <Badge variant={statusVariant[selectedAttrs.status] || "still"}>
                {selectedAttrs.status_label || selectedAttrs.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <Info
                label="City"
                value={`${selectedAttrs.city || "—"}, ${
                  selectedAttrs.country || "—"
                }`}
              />
              <Info
                label="Audience"
                value={Number(
                  selectedAttrs.audience_size || 0
                ).toLocaleString()}
              />
              <Info
                label="Clicks"
                value={selectedAttrs.stats?.total_clicks || 0}
              />
              <Info
                label="Earned"
                value={money(selectedAttrs.stats?.total_earned)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailBlock label="Niche" value={selectedAttrs.content_niche} />
              <DetailBlock
                label="Promotion channels"
                value={(selectedAttrs.promotion_channels || []).join(", ")}
              />
              <DetailBlock label="Reason" value={selectedAttrs.reason} />
              <DetailBlock
                label="Social links"
                value={(selectedAttrs.social_links || []).join("\n")}
                preserve
              />
              <DetailBlock
                label="Payout details"
                value={formatPayout(selectedAttrs.payout_details)}
                preserve
              />
              {selectedAttrs.rejection_reason && (
                <DetailBlock
                  label="Last denial reason"
                  value={selectedAttrs.rejection_reason}
                />
              )}
            </div>

            {selectedAttrs.reapplication_block_reason && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
                <p>{selectedAttrs.reapplication_block_reason}</p>
                {selectedAttrs.reapplication_available_at && (
                  <p className="mt-1 text-xs">
                    Can reapply:{" "}
                    {formatDate(selectedAttrs.reapplication_available_at)}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3 border-t border-gray-100 pt-4">
              <Textarea
                label="Admin reason"
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                rows={3}
                placeholder="Explain why this application is denied or suspended"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2">
                <Button
                  className="gap-2 bg-green-700 hover:bg-green-800"
                  onClick={handleApprove}
                  disabled={selectedAttrs.status === "approved"}
                  isLoading={approveMutation.isPending}
                  loadingText="Approving"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </Button>
                <Button
                  className="gap-2 bg-red-700 hover:bg-red-800"
                  onClick={handleReject}
                  disabled={selectedAttrs.status === "rejected"}
                  isLoading={rejectMutation.isPending}
                  loadingText="Denying"
                >
                  <XCircle className="w-4 h-4" />
                  Deny
                </Button>
                <Button
                  className="gap-2 bg-amber-700 hover:bg-amber-800"
                  onClick={handleSuspend}
                  disabled={selectedAttrs.status === "suspended"}
                  isLoading={suspendMutation.isPending}
                  loadingText="Suspending"
                >
                  <PauseCircle className="w-4 h-4" />
                  Suspend
                </Button>
                <Button
                  className="gap-2 bg-blue-700 hover:bg-blue-800"
                  onClick={handleReactivate}
                  disabled={selectedAttrs.status !== "suspended"}
                  isLoading={reactivateMutation.isPending}
                  loadingText="Restoring"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reactivate
                </Button>
                <Button
                  auto
                  className="bg-gray-200! text-gray-700! hover:bg-gray-100!"
                  onClick={closeReviewModal}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </CenterModal>
    </div>
  );
};

const ApplicationCard = ({ application, onOpen }) => {
  const attrs = application.attributes || {};

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full bg-white p-4 text-left shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {attrs.full_name}
          </p>
          <p className="text-xs text-gray-500 truncate">{attrs.email}</p>
          <p className="text-xs text-gray-500 truncate">{attrs.phone}</p>
        </div>
        <Badge
          variant={statusVariant[attrs.status] || "still"}
          className="w-24 justify-center"
        >
          {tableStatusLabel(attrs)}
        </Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <Info
          label="Audience"
          value={Number(attrs.audience_size || 0).toLocaleString()}
        />
        <Info label="Submitted" value={formatDate(attrs.created_at)} />
      </div>
      <p className="mt-3 text-sm text-gray-600 line-clamp-2">
        {attrs.content_niche || "—"}
      </p>
    </button>
  );
};

const EmptyState = () => (
  <div className="bg-white px-4 py-10 text-center text-sm text-gray-500">
    No affiliate requests found.
  </div>
);

const formatPayout = (details = {}) => {
  const entries = Object.entries(details || {});
  if (entries.length === 0) return "—";
  return entries
    .map(([key, value]) => `${key.replaceAll("_", " ")}: ${value}`)
    .join("\n");
};

const DetailBlock = ({ label, value, preserve = false }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
      {label}
    </p>
    <p
      className={`mt-1 text-sm text-gray-800 ${
        preserve ? "whitespace-pre-wrap break-words" : ""
      }`}
    >
      {value || "—"}
    </p>
  </div>
);

const Info = ({ label, value }) => (
  <div className="bg-gray-50 p-3">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">
      {value}
    </p>
  </div>
);

const Th = ({ children }) => (
  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
    {children}
  </th>
);

const Td = ({ children, className = "" }) => (
  <td className={`px-4 py-3 align-top text-gray-700 ${className}`}>
    {children}
  </td>
);

export default Affiliates;
