import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DatePicker = ({
  label,
  required = false,
  error,
  value,
  onChange,
  containerClassName = "",
  labelClassName = "",
  errorClassName = "",
  type = "date", // "date" or "datetime"
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(
    value ? new Date(value) : null
  );
  const [selectedTime, setSelectedTime] = useState(
    value && type === "datetime"
      ? {
          hours: new Date(value).getHours(),
          minutes: new Date(value).getMinutes(),
        }
      : { hours: 0, minutes: 0 }
  );
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setCurrentMonth(date.getMonth());
      setCurrentYear(date.getFullYear());
      if (type === "datetime") {
        setSelectedTime({
          hours: date.getHours(),
          minutes: date.getMinutes(),
        });
      }
    }
  }, [value, type]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(currentYear, currentMonth, day);
    if (type === "datetime") {
      newDate.setHours(selectedTime.hours, selectedTime.minutes);
    }
    setSelectedDate(newDate);
    const formattedDate =
      type === "datetime"
        ? newDate.toISOString().slice(0, 16)
        : newDate.toISOString().slice(0, 10);
    if (onChange) {
      onChange({ target: { value: formattedDate } });
    }
    if (type === "date") {
      setIsOpen(false);
    }
  };

  const handleTimeChange = (field, value) => {
    const newTime = { ...selectedTime, [field]: parseInt(value) || 0 };
    setSelectedTime(newTime);
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(newTime.hours, newTime.minutes);
      setSelectedDate(newDate);
      const formattedDate = newDate.toISOString().slice(0, 16);
      if (onChange) {
        onChange({ target: { value: formattedDate } });
      }
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const formatDisplayValue = () => {
    if (!selectedDate) return "";
    if (type === "datetime") {
      return selectedDate.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return selectedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const days = [];

  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const today = new Date();
  const isToday = (day) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    return (
      selectedDate &&
      day === selectedDate.getDate() &&
      currentMonth === selectedDate.getMonth() &&
      currentYear === selectedDate.getFullYear()
    );
  };

  return (
    <div className={`flex flex-col items-start ${containerClassName}`} ref={wrapperRef}>
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
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full rounded-xl border px-[16px] py-[9px] text-left focus:outline-none transition-all duration-200 font-light flex items-center gap-2 ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
              : "border-gray-300 focus:border-[#F68B1F]"
          }`}
        >
          <Calendar className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
          <span className={selectedDate ? "text-gray-900" : "text-gray-500"}>
            {formatDisplayValue() || "Select date"}
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-[320px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" strokeWidth={1.5} />
              </button>
              <h3 className="text-sm font-light text-gray-900">
                {MONTHS[currentMonth]} {currentYear}
              </h3>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" strokeWidth={1.5} />
              </button>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="text-xs font-light text-gray-500 text-center py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => day && handleDateSelect(day)}
                  disabled={!day}
                  className={`h-8 rounded-lg text-sm font-light transition-colors ${
                    !day
                      ? "cursor-default"
                      : isSelected(day)
                      ? "bg-primary text-white"
                      : isToday(day)
                      ? "bg-gray-100 text-gray-900 font-light"
                      : "text-gray-700 hover:bg-gray-100 font-light"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Time picker for datetime */}
            {type === "datetime" && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-light text-gray-600 mb-1">
                      Hour
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={selectedTime.hours}
                      onChange={(e) => handleTimeChange("hours", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-light focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-light text-gray-600 mb-1">
                      Minute
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={selectedTime.minutes}
                      onChange={(e) =>
                        handleTimeChange("minutes", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-light focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-4 w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-light"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className={`mt-1 text-sm text-red-600 ${errorClassName}`}>{error}</p>
      )}
    </div>
  );
};

export default DatePicker;

