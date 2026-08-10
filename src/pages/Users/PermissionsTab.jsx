import { formatRoleName } from '@/utils'
import TableSkeleton from '@/components/ui/TableSkeleton'

const PermissionsTab = ({ permissions, isLoading }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permission Name
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td className="px-6 py-4">
                    <TableSkeleton />
                  </td>
                </tr>
              ) : permissions.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500">No permissions found</td>
                </tr>
              ) : (
                permissions.map((permission) => (
                  <tr key={permission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{formatRoleName(permission.name)}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PermissionsTab
