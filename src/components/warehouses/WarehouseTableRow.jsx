import { Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const WarehouseTableRow = ({ 
  warehouse, 
  onDelete,
  onView 
}) => {
  const navigate = useNavigate()
  const attrs = warehouse.attributes || {}

  const handleView = () => {
    if (onView) {
      onView(warehouse)
    } else {
      navigate(`/warehouses/${warehouse.id}`)
    }
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td 
        className="px-3 sm:px-6 py-4 whitespace-nowrap cursor-pointer"
        onClick={handleView}
      >
        <div className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
          {attrs.name || '—'}
        </div>
      </td>
     
      <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
        <div className="text-sm text-gray-600">
          {attrs.county || '—'}
        </div>
      </td>
      <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
        <div className="text-sm text-gray-600">
          {attrs.region || '—'}
        </div>
      </td>
      
      <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
        <div className="text-sm text-gray-600">
          {attrs.address ? (
            <>
              {attrs.address.state || '—'}, {attrs.address.suburb || '—'}
            </>
          ) : (
            '—'
          )}
        </div>
      </td>
     
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete && onDelete(warehouse)
          }}
          className="text-red-600 hover:text-red-800 transition-colors p-1 hover:bg-red-50"
          title="Delete warehouse"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  )
}

export default WarehouseTableRow
