import { useState, forwardRef } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "../../lib/utils";

const PasswordInput = forwardRef(
  (
    {
      label,
      required = false,
      error,
      success = false,
      successMessage,
      containerClassName = "",
      labelClassName = "",
      inputClassName = "",
      errorClassName = "",
      successClassName = "",
      className = "",
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    const baseClasses =
      "block w-full rounded-xl font-light border px-[16px] py-[9px] focus:outline-none transition-all duration-200";
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
          <input
            ref={ref}
            type={showPassword ? "text" : "password"}
            className={cn(
              baseClasses,
              getStateClass(),
              error || success ? "pr-20" : "pr-10",
              inputClassName,
              className
            )}
            {...props}
          />

          {(error || success) && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {error ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
          )}

          <button
            type="button"
            onClick={togglePasswordVisibility}
            className={cn(
              "absolute inset-y-0 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none",
              error || success ? "right-8 pr-3" : "right-0 pr-3"
            )}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>

        {error && (
          <p className={cn("mt-1 text-sm text-red-600", errorClassName)}>
            {error}
          </p>
        )}

        {success && successMessage && (
          <p className={cn("mt-1 text-sm text-green-600", successClassName)}>
            {successMessage}
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;

