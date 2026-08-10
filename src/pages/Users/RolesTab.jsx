import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { userService } from '@/services/user.service'
import { formatRoleName } from '@/utils'
import TableSkeleton from '@/components/ui/TableSkeleton'
import Checkbox from '@/components/ui/Checkbox'
import { Edit2 } from 'lucide-react'

const RolesTab = ({ roles, isLoading }) => {
  const toast = useToast()
  const queryClient = useQueryClient()

  const updateRoleMutation = useMutation({
    mutationFn: ({ roleId, description }) => userService.updateRole(roleId, description),
    onSuccess: () => {
      toast.success('Role Updated', 'Role description has been updated successfully')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to update role'
      toast.error('Role Update Failed', errorMessage)
    },
  })

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-4">
                    <TableSkeleton />
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                    No roles found
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <RoleRow
                    key={role.id}
                    role={role}
                    onUpdate={(id, description) =>
                      updateRoleMutation.mutate({ roleId: id, description })
                    }
                    isLoading={updateRoleMutation.isPending}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const RoleRow = ({ role, onUpdate, isLoading }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [description, setDescription] = useState(role.description || '')

  const handleSave = () => {
    onUpdate(role.id, description)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDescription(role.description || '')
    setIsEditing(false)
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{formatRoleName(role.name)}</div>
      </td>
      <td className="px-6 py-4">
        {isEditing ? (
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
        ) : (
          <div className="text-sm text-gray-600">{role.description || 'No description'}</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="text-primary hover:text-primary-dark transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-primary hover:text-primary-dark transition-colors"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        )}
      </td>
    </tr>
  )
}

export default RolesTab
