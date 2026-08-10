import React, { forwardRef } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

const Textarea = forwardRef(
  (
    {
      label,
      required = false,
      error,
      success = false,
      successMessage,
      containerClassName = "",
      labelClassName = "",
      textareaClassName = "",
      errorClassName = "",
      successClassName = "",
      className = "",
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "block w-full rounded-xl font-light border px-[16px] py-[12px] focus:outline-none transition-all duration-200 resize-none";
    const stateClasses = {
      normal: "border-gray-300 focus:border-[#F68B1F]",
      error:
        "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200",
      success:
        "border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-200",
      disabled: "bg-gray-100 cursor-not-allowed",
    };

    const getStateClass = () => {
      if (props.disabled) return stateClasses.disabled;
      if (error) return stateClasses.error;
      if (success) return stateClasses.success;
      return stateClasses.normal;
    };

    return (
      <div className={`flex flex-col items-start ${containerClassName}`}>
        {label && (
          <label
            className={`block text-sm font-medium mb-1 ${labelClassName} ${
              error ? "text-red-600" : "text-gray-700"
            }`}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative w-full">
          <textarea
            ref={ref}
            className={`${baseClasses} ${getStateClass()} ${textareaClassName} ${className}`}
            {...props}
          />

          {(error || success) && (
            <div className="absolute top-3 right-3 flex items-center pointer-events-none">
              {error ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
          )}
        </div>

        {error && (
          <p className={`mt-1 text-sm text-red-600 ${errorClassName}`}>
            {error}
          </p>
        )}

        {success && successMessage && (
          <p className={`mt-1 text-sm text-green-600 ${successClassName}`}>
            {successMessage}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;

