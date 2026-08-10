import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";

let selectCounter = 0;

const Select = ({
  label,
  required = false,
  options = [],
  error,
  success = false,
  successMessage,
  containerClassName = "",
  labelClassName = "",
  selectClassName = "",
  errorClassName = "",
  successClassName = "",
  value,
  onChange,
  name, // Added name prop for form handling
  placeholder = "Select an option",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const openDropdownIdRef = useRef(null);
  const uniqueIdRef = useRef(`select-${++selectCounter}`);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleClickOutside = useCallback((event) => {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
      setIsOpen(false);
      openDropdownIdRef.current = null;
    }
  }, []);

  const toggleDropdown = () => {
    if (disabled) return;
    if (openDropdownIdRef.current === uniqueIdRef.current) {
      setIsOpen(false);
      openDropdownIdRef.current = null;
    } else {
      setIsOpen(true);
      openDropdownIdRef.current = uniqueIdRef.current;
    }
  };

  const handleOptionClick = (optionValue) => {
    const syntheticEvent = {
      target: {
        name: name,
        value: optionValue,
      },
    };
    onChange(syntheticEvent); 
    setIsOpen(false);
    openDropdownIdRef.current = null;
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  useEffect(() => {
    if (isOpen && openDropdownIdRef.current !== uniqueIdRef.current) {
      setIsOpen(false);
    }
  }, [isOpen]);

  return (
    <div
      className={`relative text-gray-700 ${containerClassName}`}
      ref={wrapperRef}
    >
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

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          className={`w-full text-left rounded-xl border px-[16px] py-[12px]  transition-all duration-200 ${
            disabled
              ? "bg-gray-100 cursor-not-allowed border-gray-300"
              : error
              ? "border-red-500 focus:border-red-500"
              : success
              ? "border-green-500 focus:border-green-500"
              : "border-gray-300 "
          } ${selectClassName}`}
          onClick={toggleDropdown}
        >
          <div className="flex items-center justify-between">
            <span className={!value ? "text-gray-500" : "truncate"}>
              {selectedOption?.label || placeholder}
            </span>
            <ChevronDown
              size={20}
              className={` transform transition-transform ${
                isOpen ? "rotate-180" : ""
              } ${
                disabled
                  ? "text-gray-400"
                  : error
                  ? "text-red-500"
                  : success
                  ? "text-green-500"
                  : "text-gray-400"
              }`}
            />
          </div>
        </button>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-20 mt-2 w-full rounded-xl bg-white shadow-lg border border-gray-200 overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {options.map((option, index) => (
              <div
                key={option.value}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 truncate ${
                  value === option.value ? "bg-gray-200" : ""
                } ${
                  index === 0 ? "rounded-t-xl" : ""
                } ${
                  index === options.length - 1 ? "rounded-b-xl" : ""
                }`}
                onClick={() => handleOptionClick(option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className={`mt-1 text-sm text-red-600 ${errorClassName}`}>{error}</p>
      )}

      {success && successMessage && (
        <p className={`mt-1 text-sm text-green-600 ${successClassName}`}>
          {successMessage}
        </p>
      )}
    </div>
  );
};

Select.displayName = "Select";

export default Select;

