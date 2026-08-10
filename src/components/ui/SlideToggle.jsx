import React from "react";
import { Check, X } from "lucide-react";

export const SlideToggle = ({
  label,
  value,
  onChange,
  disabled = false,
  onLabel = "Enabled",
  offLabel = "Disabled",
  containerClassName = "",
}) => {
  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!value);
    }
  };

  return (
    <div className={`flex items-center gap-3 ${containerClassName}`}>
      {label && (
        <label className="text-sm font-light text-gray-700">{label}</label>
      )}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`relative inline-flex h-4 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          value ? "bg-primary" : "bg-gray-300"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        role="switch"
        aria-checked={value}
      >
        <span
          className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-lg transition-transform border-2 ${
            value
              ? "translate-x-6 border-primary"
              : "translate-x-[-2px] border-gray-300"
          }`}
        >
          <div className="flex items-center justify-center h-full">
            {value ? (
              <Check className="h-4 w-4 text-primary" strokeWidth={1.5} />
            ) : (
              <X className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
            )}
          </div>
        </span>
      </button>
      <span className="text-sm font-light text-gray-600">
        {value ? onLabel : offLabel}
      </span>
    </div>
  );
};

