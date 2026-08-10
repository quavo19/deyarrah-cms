import { X } from "lucide-react";
import Button from "./Button";
import { cn } from "@/lib/utils";

export const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  description = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default", // default, danger, success
  isLoading = false,
}) => {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/80 h-full animate-in fade-in-0"
        onClick={onClose}
      />
      <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-lg p-6 animate-in fade-in-0 zoom-in-95">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-6">{description}</p>
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              "flex-1 sm:flex-initial bg-gray-200! text-gray-700! border-gray-300 hover:bg-gray-50"
            )}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            isLoading={isLoading}
            loadingText="Processing..."
            className={cn(
              "flex-1 sm:flex-initial",
              variant === "danger" && "bg-red-600! hover:bg-red-700!",
              variant === "success" && "bg-green-600! hover:bg-green-700!"
            )}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </>
  );
};
