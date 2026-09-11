import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { userService } from "@/services/user.service";
import Button from "@/components/ui/Button";
import CenterModal from "@/components/ui/CenterModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import Input from "@/components/ui/Input";
import ModalSheet from "@/components/ui/ModalSheet";
import Select from "@/components/ui/Select";
import TableSkeleton from "@/components/ui/TableSkeleton";
import Textarea from "@/components/ui/Textarea";

const emptyForm = { name: "", description: "", bonus_points: "0" };
const USERS_PER_PAGE = 8;

const BadgesTab = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [formModal, setFormModal] = useState({ open: false, badge: null });
  const [detailModal, setDetailModal] = useState({ open: false, badge: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, badge: null });
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [selectedUserId, setSelectedUserId] = useState("");
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [unlockedUsersPage, setUnlockedUsersPage] = useState(1);

  const { data: badgesData, isLoading } = useQuery({
    queryKey: ["badges"],
    queryFn: userService.getAllBadges,
  });

  const { data: detailData, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["badges", detailModal.badge?.id],
    queryFn: () => userService.getBadgeById(detailModal.badge.id),
    enabled: Boolean(detailModal.open && detailModal.badge?.id),
  });

  const { data: usersData } = useQuery({
    queryKey: ["users", "badge-options"],
    queryFn: () => userService.getAllUsers({ per_page: 100 }),
    enabled: detailModal.open,
  });

  const badges = badgesData?.data || [];
  const detailBadge = detailData?.data || detailModal.badge;
  const unlockedUsers = useMemo(() => detailBadge?.users || [], [detailBadge]);
  const sortedUnlockedUsers = useMemo(
    () =>
      [...unlockedUsers].sort((a, b) => {
        const aTime = a.unlocked_at ? new Date(a.unlocked_at).getTime() : 0;
        const bTime = b.unlocked_at ? new Date(b.unlocked_at).getTime() : 0;
        return bTime - aTime;
      }),
    [unlockedUsers]
  );
  const unlockedUsersTotalPages = Math.max(
    1,
    Math.ceil(sortedUnlockedUsers.length / USERS_PER_PAGE)
  );
  const currentUnlockedUsersPage = Math.min(
    unlockedUsersPage,
    unlockedUsersTotalPages
  );
  const paginatedUnlockedUsers = sortedUnlockedUsers.slice(
    (currentUnlockedUsersPage - 1) * USERS_PER_PAGE,
    currentUnlockedUsersPage * USERS_PER_PAGE
  );

  const userOptions = useMemo(() => {
    const unlockedIds = new Set(unlockedUsers.map((user) => user.id));
    const availableUsers = (usersData?.data || []).filter(
      (user) => !unlockedIds.has(user.id)
    );

    return [
      { value: "", label: "Select user" },
      ...availableUsers.map((user) => ({
        value: user.id,
        label:
          `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
          user.email,
      })),
    ];
  }, [usersData, unlockedUsers]);

  const saveMutation = useMutation({
    mutationFn: ({ badgeId, payload }) =>
      badgeId
        ? userService.updateBadge(badgeId, payload)
        : userService.createBadge(payload),
    onSuccess: () => {
      toast.success(
        "Badge Saved",
        "Badge details have been saved successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      setFormModal({ open: false, badge: null });
      setFormData(emptyForm);
      setFormErrors({});
    },
    onError: (error) => {
      toast.error(
        "Save Failed",
        error.response?.data?.error || "Failed to save badge"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: userService.deleteBadge,
    onSuccess: () => {
      toast.success("Badge Deleted", "Badge has been deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      setDeleteModal({ open: false, badge: null });
    },
    onError: (error) => {
      toast.error(
        "Delete Failed",
        error.response?.data?.error || "Failed to delete badge"
      );
    },
  });

  const addUserMutation = useMutation({
    mutationFn: ({ badgeId, userId }) =>
      userService.addBadgeUser(badgeId, userId),
    onSuccess: () => {
      toast.success("Badge Unlocked", "User has been added to this badge");
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      queryClient.invalidateQueries({
        queryKey: ["badges", detailModal.badge?.id],
      });
      setSelectedUserId("");
    },
    onError: (error) => {
      toast.error(
        "Unlock Failed",
        error.response?.data?.error || "Failed to add user"
      );
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: ({ badgeId, userId }) =>
      userService.removeBadgeUser(badgeId, userId),
    onSuccess: () => {
      toast.success("Badge Updated", "User has been removed from this badge");
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      queryClient.invalidateQueries({
        queryKey: ["badges", detailModal.badge?.id],
      });
    },
    onError: (error) => {
      toast.error(
        "Update Failed",
        error.response?.data?.error || "Failed to remove user"
      );
    },
  });

  const openCreate = () => {
    setFormData(emptyForm);
    setFormErrors({});
    setFormModal({ open: true, badge: null });
  };

  const openEdit = (badge) => {
    setFormData({
      name: badge.name || "",
      description: badge.description || "",
      bonus_points: String(badge.bonus_points ?? 0),
    });
    setFormErrors({});
    setFormModal({ open: true, badge });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      setFormErrors({ name: "Name is required" });
      return;
    }

    const bonusPoints = Number(formData.bonus_points || 0);
    if (!Number.isInteger(bonusPoints) || bonusPoints < 0) {
      setFormErrors({ bonus_points: "Bonus points must be 0 or greater" });
      return;
    }

    saveMutation.mutate({
      badgeId: formModal.badge?.id,
      payload: {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        bonus_points: bonusPoints,
      },
    });
  };

  const handleAddUser = () => {
    if (!selectedUserId || !detailBadge?.id) return;
    addUserMutation.mutate({ badgeId: detailBadge.id, userId: selectedUserId });
  };

  const handleMenuAction = (action, badge) => {
    setOpenActionMenuId(null);

    if (action === "view") {
      setDetailModal({ open: true, badge });
      setUnlockedUsersPage(1);
    } else if (action === "edit") {
      openEdit(badge);
    } else if (action === "delete") {
      setDeleteModal({ open: true, badge });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="w-auto gap-2 text-sm">
          <Plus className="h-4 w-4" />
          Create Badge
        </Button>
      </div>

      <div className="bg-white overflow-visible">
        <div className="overflow-visible">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Badge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bonus Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unlocked
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4">
                    <TableSkeleton />
                  </td>
                </tr>
              ) : badges.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No badges found
                  </td>
                </tr>
              ) : (
                badges.map((badge) => (
                  <tr key={badge.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {badge.name}
                      </div>
                      <div className="text-sm text-gray-500 max-w-xl truncate">
                        {badge.description || "No description"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {badge.bonus_points ?? 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {badge.unlocked_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="relative inline-flex justify-end">
                        <button
                          onClick={() =>
                            setOpenActionMenuId(
                              openActionMenuId === badge.id ? null : badge.id
                            )
                          }
                          className="cursor-pointer px-3 py-1 text-xl leading-none text-gray-600 hover:text-gray-900"
                          title="Badge actions"
                        >
                          ...
                        </button>
                        {openActionMenuId === badge.id && (
                          <div className="absolute right-0 top-8 z-30 min-w-32 border border-gray-200 bg-white shadow-lg">
                            <button
                              onClick={() => handleMenuAction("view", badge)}
                              className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleMenuAction("edit", badge)}
                              className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleMenuAction("delete", badge)}
                              className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CenterModal
        open={formModal.open}
        onClose={() => setFormModal({ open: false, badge: null })}
        heading={formModal.badge ? "Edit Badge" : "Create Badge"}
      >
        <div className="space-y-4">
          <Input
            label="Badge Name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              setFormErrors({});
            }}
            error={formErrors.name}
            required
          />
          <Input
            label="Bonus Points"
            type="number"
            min="0"
            step="1"
            value={formData.bonus_points}
            onChange={(e) => {
              setFormData({ ...formData, bonus_points: e.target.value });
              setFormErrors({});
            }}
            error={formErrors.bonus_points}
            required
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              onClick={() => setFormModal({ open: false, badge: null })}
              className="w-auto bg-gray-200! text-gray-700! hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              isLoading={saveMutation.isPending}
              loadingText="Saving..."
              className="w-auto"
            >
              Save Badge
            </Button>
          </div>
        </div>
      </CenterModal>

      <ModalSheet
        open={detailModal.open}
        onOpenChange={(open) => {
          if (!open) {
            setDetailModal({ open: false, badge: null });
            setSelectedUserId("");
          }
        }}
        heading={detailBadge?.name || "Badge Details"}
        description={detailBadge?.description}
        className="w-full sm:max-w-xl"
      >
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
            Bonus Points: {detailBadge?.bonus_points ?? 0}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <Select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              options={userOptions}
            />
            <Button
              onClick={handleAddUser}
              disabled={!selectedUserId}
              isLoading={addUserMutation.isPending}
              loadingText="Adding..."
              className="w-auto"
            >
              Unlock
            </Button>
          </div>

          <div className="border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-sm font-medium text-gray-900">
                Unlocked Users
              </div>
              <div className="text-xs text-gray-500">Latest first</div>
            </div>

            {isLoadingDetail ? (
              <div className="p-4">
                <TableSkeleton />
              </div>
            ) : sortedUnlockedUsers.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No users have unlocked this badge.
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-200">
                  {paginatedUnlockedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {`${user.first_name || ""} ${
                            user.last_name || ""
                          }`.trim() || user.email}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.email} -{" "}
                          {user.unlocked_at
                            ? new Date(user.unlocked_at).toLocaleString()
                            : "Unlocked"}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          removeUserMutation.mutate({
                            badgeId: detailBadge.id,
                            userId: user.id,
                          })
                        }
                        className="cursor-pointer text-red-600 hover:text-red-800"
                        title="Remove user"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      setUnlockedUsersPage((page) => Math.max(1, page - 1))
                    }
                    disabled={currentUnlockedUsersPage === 1}
                    className="cursor-pointer text-sm text-gray-700 disabled:cursor-not-allowed disabled:text-gray-300"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {currentUnlockedUsersPage} of {unlockedUsersTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setUnlockedUsersPage((page) =>
                        Math.min(unlockedUsersTotalPages, page + 1)
                      )
                    }
                    disabled={
                      currentUnlockedUsersPage === unlockedUsersTotalPages
                    }
                    className="cursor-pointer text-sm text-gray-700 disabled:cursor-not-allowed disabled:text-gray-300"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </ModalSheet>

      <ConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, badge: null })}
        onConfirm={() => deleteMutation.mutate(deleteModal.badge.id)}
        title="Delete Badge"
        description={`Delete ${
          deleteModal.badge?.name || "this badge"
        }? This will remove it from every user who unlocked it.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default BadgesTab;
