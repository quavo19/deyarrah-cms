import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, RefreshCw } from 'lucide-react'
import { contactService } from '@/services/contact.service'
import { SearchInput } from '@/components/ui/SearchInput'
import Button from '@/components/ui/Button'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { useToast } from '@/hooks/useToast'

const Contacts = () => {
  const toast = useToast()
  const queryClient = useQueryClient()

  const [query, setQuery] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const {
    data: contactsData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['contacts', { query, email, name, phone }],
    queryFn: () =>
      contactService.list({
        query: query || undefined,
        email: email || undefined,
        name: name || undefined,
        phone: phone || undefined,
      }),
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    staleTime: 0,
    cacheTime: 0,
  })

  const contacts = contactsData?.data || []

  const deleteMutation = useMutation({
    mutationFn: (id) => contactService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Deleted', 'Contact message deleted')
    },
    onError: (error) => {
      const msg = error.response?.data?.error || 'Failed to delete contact message'
      toast.error('Delete Failed', msg)
    },
  })

  const formatDate = (value) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleDelete = (contact) => {
    const attrs = contact?.attributes || {}
    const label = attrs.email || attrs.name || contact?.id || 'this message'
    const ok = window.confirm(`Delete contact message from ${label}?`)
    if (!ok) return
    deleteMutation.mutate(contact.id)
  }

  return (
    <div className="bg-gray-50 montserrat min-h-screen">
      <div className="max-w-7xl mx-auto p-2 sm:p-6">
        <div className="flex flex-col mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Contacts</h1>
            <p className="text-sm sm:text-base text-gray-600">
              View and manage contact messages.
            </p>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between gap-4 w-full flex-col sm:flex-row">
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search email, name, or phone..."
            className="w-full!"
          />
          <div className="flex gap-3 w-full! sm:w-auto!">
            <Button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200! hover:bg-gray-300! text-gray-700!"
              auto
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Filter email..."
            className="w-full px-4 py-2 bg-white rounded-lg border border-gray-200 focus:outline-none font-light"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Filter name..."
            className="w-full px-4 py-2 bg-white rounded-lg border border-gray-200 focus:outline-none font-light"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Filter phone..."
            className="w-full px-4 py-2 bg-white rounded-lg border border-gray-200 focus:outline-none font-light"
          />
        </div>

        <div className="bg-white overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Message
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Received
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8">
                      <TableSkeleton />
                    </td>
                  </tr>
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      {query || email || name || phone
                        ? 'No contact messages found matching your filters'
                        : 'No contact messages found'}
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => {
                    const attrs = contact?.attributes || {}
                    return (
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {attrs.name || '—'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {attrs.email || '—'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {attrs.phone || '—'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">
                          <div className="max-w-xl line-clamp-2">{attrs.message || '—'}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                          {formatDate(attrs.created_at)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDelete(contact)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contacts

