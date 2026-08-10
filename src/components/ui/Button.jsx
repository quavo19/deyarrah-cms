const Button = ({
  type = "button",
  disabled = false,
  isLoading = false,
  loadingText = "Processing",
  className = "",
  auto = false,
  children,
  ...props
}) => {
  const widthClass = auto || className.includes('w-') ? '' : 'w-full'
  
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`relative ${widthClass} px-4 cursor-pointer py-2 bg-primary hover:bg-primary-dark text-white font-light rounded-lg transition-all duration-200 flex items-center justify-center ${
        disabled || isLoading ? "opacity-70 cursor-not-allowed" : ""
      } ${className}`}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {isLoading ? loadingText : children}
    </button>
  );
};

export default Button;

