import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { userService } from '@/services/user.service'
import { formatRoleName } from '@/utils'
import Select from '@/components/ui/Select'
import ModalSheet from '@/components/ui/ModalSheet'
import Checkbox from '@/components/ui/Checkbox'
import UsersTab from './Users/UsersTab'
import RolesTab from './Users/RolesTab'
import PermissionsTab from './Users/PermissionsTab'
import BadgesTab from './Users/BadgesTab'

const Users = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('users')
  const [permissionsModal, setPermissionsModal] = useState({ open: false, user: null })
  const [roleModal, setRoleModal] = useState({ open: false, user: null })
  const [selectedPermissions, setSelectedPermissions] = useState([])

  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: userService.getAllRoles,
    enabled: activeTab === 'roles' || activeTab === 'users',
  })

  const { data: permissionsData, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: userService.getAllPermissions,
    enabled: activeTab === 'permissions' || permissionsModal.open,
  })

  const roles = rolesData?.data || []
  const permissions = permissionsData?.data || []

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }) => userService.assignRole(userId, roleId),
    onSuccess: () => {
      toast.success('Role Assigned', 'User role has been updated successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setRoleModal({ open: false, user: null })
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to assign role'
      toast.error('Role Assignment Failed', errorMessage)
    },
  })

  const assignPermissionsMutation = useMutation({
    mutationFn: ({ userId, permissionIds }) => userService.assignPermissions(userId, permissionIds),
    onSuccess: () => {
      toast.success('Permissions Updated', 'User permissions have been updated successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setPermissionsModal({ open: false, user: null })
      setSelectedPermissions([])
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to update permissions'
      toast.error('Permission Update Failed', errorMessage)
    },
  })

  const handleRoleChange = (user, roleId) => {
    assignRoleMutation.mutate({
      userId: user.id,
      roleId,
    })
  }

  const handleOpenPermissionsModal = (user) => {
    setSelectedPermissions(user.permissions?.map((p) => p.id) || [])
    setPermissionsModal({ open: true, user })
  }

  const handleOpenRoleModal = (user) => {
    setRoleModal({ open: true, user })
  }

  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleSavePermissions = () => {
    assignPermissionsMutation.mutate({
      userId: permissionsModal.user.id,
      permissionIds: selectedPermissions,
    })
  }

  return (
    <div className="bg-gray-50 montserrat">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col mb-6">
          <h1 className="text-lg sm:text-xl font-semibold ">User Management</h1>
          <p className="text-gray-600">Manage users, roles, permissions, and badges.</p>
        </div>

        <div className="border-b border-gray-200 max-w-fit mb-6">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'users'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'roles'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Roles
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'permissions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Permissions
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === 'badges'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Badges
            </button>
          </nav>
        </div>

        {activeTab === 'users' && (
          <UsersTab
            roles={roles}
            onEditRole={handleOpenRoleModal}
            onEditPermissions={handleOpenPermissionsModal}
          />
        )}

        {activeTab === 'roles' && <RolesTab roles={roles} isLoading={isLoadingRoles} />}

        {activeTab === 'permissions' && (
          <PermissionsTab permissions={permissions} isLoading={isLoadingPermissions} />
        )}

        {activeTab === 'badges' && <BadgesTab />}

        <ModalSheet
          open={permissionsModal.open}
          onOpenChange={(open) => !open && setPermissionsModal({ open: false, user: null })}
          heading="Edit Permissions"
          description={`Manage permissions for ${permissionsModal.user?.first_name} ${permissionsModal.user?.last_name}`}
          primaryButton={{
            text: 'Save Changes',
            onClick: handleSavePermissions,
            disabled: assignPermissionsMutation.isPending,
            isLoading: assignPermissionsMutation.isPending,
            loadingText: 'Saving...',
          }}
          secondaryButton={{
            text: 'Cancel',
            onClick: () => setPermissionsModal({ open: false, user: null }),
          }}
        >
          <div className="flex flex-col max-h-[60vh] overflow-y-auto">
            {permissions.map((permission) => (
              <label
                key={permission.id}
                className="flex items-center gap-3 p-3 cursor-pointer"
              >
                <Checkbox
                  checked={selectedPermissions.includes(permission.id)}
                  onChange={() => handlePermissionToggle(permission.id)}
                />
                <span className="text-sm text-gray-900">{formatRoleName(permission.name)}</span>
              </label>
            ))}
          </div>
        </ModalSheet>

        <ModalSheet
          open={roleModal.open}
          onOpenChange={(open) => !open && setRoleModal({ open: false, user: null })}
          heading="Change Role"
          description={`Assign a new role to ${roleModal.user?.first_name} ${roleModal.user?.last_name}`}
          secondaryButton={{
            text: 'Close',
            onClick: () => setRoleModal({ open: false, user: null }),
          }}
        >
          <div className="space-y-4">
            <Select
              label="Select Role"
              value={roleModal.user?.role?.id || ''}
              onChange={(e) => {
                if (e.target.value && roleModal.user) {
                  handleRoleChange(roleModal.user, e.target.value)
                }
              }}
              options={roles.map((role) => ({ value: role.id, label: formatRoleName(role.name) }))}
              placeholder="Select a role"
              disabled={assignRoleMutation.isPending}
            />
          </div>
        </ModalSheet>
      </div>
    </div>
  )
}

export default Users
