import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const BackButton = ({ 
  onClick, 
  to, 
  className = '',
  iconClassName = '',
  children 
}) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (to) {
      navigate(to)
    } else {
      navigate(-1)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors',
        'bg-transparent border-none outline-none',
        'focus:outline-none focus:ring-0',
        className
      )}
    >
      <ArrowLeft className={cn('w-5 h-5', iconClassName)} />
      {children && <span>{children}</span>}
    </button>
  )
}

export default BackButton
