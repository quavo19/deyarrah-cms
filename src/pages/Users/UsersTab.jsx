import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { userService } from '@/services/user.service'
import { formatRoleName } from '@/utils'
import { SearchInput } from '@/components/ui/SearchInput'
import Select from '@/components/ui/Select'
import { Pagination } from '@/components/ui/Pagination'
import { SlideToggle } from '@/components/ui/SlideToggle'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import CenterModal from '@/components/ui/CenterModal'
import TableSkeleton from '@/components/ui/TableSkeleton'
import Image from '@/components/ui/Image'
import { Edit2, Key, User as UserIcon } from 'lucide-react'

const UsersTab = ({ roles, onEditRole, onEditPermissions }) => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [blockedFilter, setBlockedFilter] = useState(searchParams.get('blocked') || '')
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role_id') || '')
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null, data: null })
  const [previewModal, setPreviewModal] = useState({ open: false, user: null })
  const prevFiltersRef = useRef({ search, blockedFilter, roleFilter })

  const page = parseInt(searchParams.get('page') || '1')

  const {
    data: usersData,
    isLoading: isLoadingUsers,
  } = useQuery({
    queryKey: ['users', page, search, blockedFilter, roleFilter],
    queryFn: () =>
      userService.getAllUsers({
        page,
        search: search || undefined,
        blocked: blockedFilter || undefined,
        role_id: roleFilter || undefined,
      }),
  })

  const users = usersData?.data || []
  const meta = usersData?.meta || { current_page: 1, total_pages: 1, total_count: 0 }

  const blockMutation = useMutation({
    mutationFn: ({ userId, blocked }) =>
      blocked ? userService.blockUser(userId) : userService.unblockUser(userId),
    onSuccess: () => {
      toast.success('User Updated', 'User status has been updated successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setConfirmModal({ open: false, type: null, data: null })
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to update user status'
      toast.error('Update Failed', errorMessage)
    },
  })

  useEffect(() => {
    const prevFilters = prevFiltersRef.current
    const filtersChanged = 
      prevFilters.search !== search ||
      prevFilters.blockedFilter !== blockedFilter ||
      prevFilters.roleFilter !== roleFilter

    if (filtersChanged) {
      const params = new URLSearchParams(searchParams)
      if (search) {
        params.set('search', search)
      } else {
        params.delete('search')
      }
      if (blockedFilter) {
        params.set('blocked', blockedFilter)
      } else {
        params.delete('blocked')
      }
      if (roleFilter) {
        params.set('role_id', roleFilter)
      } else {
        params.delete('role_id')
      }
      params.set('page', '1')
      setSearchParams(params)
      prevFiltersRef.current = { search, blockedFilter, roleFilter }
    }
  }, [search, blockedFilter, roleFilter, searchParams, setSearchParams])

  const handleBlockToggle = (user) => {
    setConfirmModal({
      open: true,
      type: 'block',
      data: user,
    })
  }

  const handleConfirmBlock = () => {
    const { data: user } = confirmModal
    blockMutation.mutate({
      userId: user.id,
      blocked: !user.blocked,
    })
  }

  const roleOptions = useMemo(
    () => [
      { value: '', label: 'All Roles' },
      ...roles.map((role) => ({ value: role.id, label: formatRoleName(role.name) })),
    ],
    [roles]
  )

  const blockedOptions = [
    { value: '', label: 'All Users' },
    { value: 'false', label: 'Active' },
    { value: 'true', label: 'Blocked' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
        />
        <Select
          value={blockedFilter}
          onChange={(e) => setBlockedFilter(e.target.value)}
          options={blockedOptions}
          selectClassName="py-[10px]! text-sm!"
          placeholder="Filter by status"
        />
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          options={roleOptions}
          selectClassName="py-[10px]! text-sm!"
          placeholder="Filter by role"
        />
      </div>

      <div className="bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoadingUsers ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4">
                    <TableSkeleton />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onBlockToggle={handleBlockToggle}
                    blockMutationPending={blockMutation.isPending}
                    onEditRole={onEditRole}
                    onEditPermissions={onEditPermissions}
                    onPreview={() => setPreviewModal({ open: true, user })}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {meta.total_pages > 1 && (
        <Pagination
          currentPage={meta.current_page}
          totalPages={meta.total_pages}
          onPageChange={(newPage) => {
            const params = new URLSearchParams(searchParams)
            params.set('page', newPage.toString())
            setSearchParams(params)
          }}
        />
      )}

      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, type: null, data: null })}
        onConfirm={handleConfirmBlock}
        title={confirmModal.data?.blocked ? 'Unblock User' : 'Block User'}
        description={
          confirmModal.data
            ? `Are you sure you want to ${confirmModal.data.blocked ? 'unblock' : 'block'} ${
                confirmModal.data.first_name
              } ${confirmModal.data.last_name}?`
            : ''
        }
        confirmText={confirmModal.data?.blocked ? 'Unblock' : 'Block'}
        variant={confirmModal.data?.blocked ? 'success' : 'danger'}
        isLoading={blockMutation.isPending}
      />

      <CenterModal
        open={previewModal.open}
        onClose={() => setPreviewModal({ open: false, user: null })}
        heading={`${previewModal.user?.first_name} ${previewModal.user?.last_name}`}
        className="max-w-4xl"
      >
        <div className="flex flex-col items-center gap-6">
          <Image
            src={previewModal.user?.avatar}
            alt={`${previewModal.user?.first_name} ${previewModal.user?.last_name}`}
            className="h-80 w-80 rounded-xl"
            iconClassName="h-40 w-40"
            fallbackIcon={UserIcon}
          />
          <div className="text-center space-y-3 w-full">
            <p className="text-sm text-gray-600 mb-4">{previewModal.user?.email}</p>
            <div className="text-sm text-gray-600">
              Role: <span className="font-medium text-gray-900">{formatRoleName(previewModal.user?.role?.name)}</span>
            </div>
            <div className="text-sm text-gray-600">
              Permissions: <span className="font-medium text-gray-900">{previewModal.user?.permissions?.length || 0}</span>
            </div>
            <div className="text-sm text-gray-600">
              Status: <span className={`font-medium ${previewModal.user?.blocked ? 'text-red-600' : 'text-green-600'}`}>
                {previewModal.user?.blocked ? 'Blocked' : 'Active'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Created: <span className="font-medium text-gray-900">
                {previewModal.user?.created_at ? new Date(previewModal.user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </CenterModal>
    </div>
  )
}

const UserRow = ({ user, onBlockToggle, blockMutationPending, onEditRole, onEditPermissions, onPreview }) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="shrink-0 h-10 w-10 cursor-pointer" onClick={onPreview}>
              <Image
                src={user.avatar}
                alt={`${user.first_name} ${user.last_name}`}
                className="h-10 w-10 rounded-xl"
                iconClassName="h-6 w-6"
                fallbackIcon={UserIcon}
              />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {user.first_name} {user.last_name}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(user.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{user.email}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-900">{formatRoleName(user.role?.name) || 'N/A'}</span>
          {onEditRole && (
            <button
              onClick={() => onEditRole(user)}
              className="text-primary hover:text-primary-dark transition-colors"
              title="Change role"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {user.permissions?.length || 0} permission{user.permissions?.length !== 1 ? 's' : ''}
          </span>
          {onEditPermissions && (
            <button
              onClick={() => onEditPermissions(user)}
              className="text-primary hover:text-primary-dark transition-colors"
              title="Edit permissions"
            >
              <Key className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <SlideToggle
          value={!user.blocked}
          onChange={() => onBlockToggle(user)}
          disabled={blockMutationPending}
          onLabel="Active"
          offLabel="Blocked"
        />
      </td>
    </tr>
  )
}

export default UsersTab
