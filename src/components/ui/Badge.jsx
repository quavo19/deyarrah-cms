const Badge = ({
  variant = 'still',
  children,
  className = '',
  ...props
}) => {
  const variantStyles = {
    success: 'bg-green-100 text-green-800 border border-green-500',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-500',
    error: 'bg-red-100 text-red-800 border border-red-500',
    info: 'bg-blue-100 text-blue-800 border border-blue-500',
    still: 'bg-gray-100 text-gray-800 border border-gray-500',
  }

  const baseStyles = 'inline-flex px-4 py-1 text-xs font-light capitalize rounded-full'

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.still} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

export default Badge
