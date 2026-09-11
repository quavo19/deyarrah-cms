import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Award, BadgeDollarSign, Home, Key, MapPin, Shield, User as UserIcon } from 'lucide-react'
import { userService } from '@/services/user.service'
import Image from '@/components/ui/Image'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { formatRoleName } from '@/utils'

const UserDetail = () => {
  const { id } = useParams()

  const {
    data: userData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['users', id],
    queryFn: () => userService.getUserById(id),
    enabled: Boolean(id),
  })

  const user = userData?.data
  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User'
  const addresses = user?.addresses || []
  const permissions = user?.permissions || []
  const badges = user?.badges || []

  if (isLoading) {
    return (
      <div className="bg-gray-50 montserrat min-h-screen">
        <div className="max-w-7xl mx-auto p-6">
          <TableSkeleton />
        </div>
      </div>
    )
  }

  if (isError || !user) {
    return (
      <div className="bg-gray-50 montserrat min-h-screen">
        <div className="max-w-7xl mx-auto p-6">
          <Link to="/users" className="inline-flex items-center gap-2 text-sm text-primary mb-6">
            <ArrowLeft className="h-4 w-4" />
            Users
          </Link>
          <div className="bg-white p-8 text-center text-gray-600">
            User details could not be loaded.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 montserrat min-h-screen">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Link to="/users" className="inline-flex items-center gap-2 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" />
          Users
        </Link>

        <div className="bg-white p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <Image
              src={user.avatar}
              alt={fullName}
              className="h-24 w-24 rounded-xl"
              iconClassName="h-12 w-12"
              fallbackIcon={UserIcon}
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
              <p className="text-sm text-gray-600">{user.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.blocked ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {user.blocked ? 'Blocked' : 'Active'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {formatRoleName(user.role?.name)}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                  {user.otp_enabled ? 'OTP Enabled' : 'OTP Disabled'}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-4 min-w-48">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BadgeDollarSign className="h-4 w-4 text-primary" />
                Bonus Balance
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {Number(user.bonus?.balance || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Section title="Role" icon={Shield}>
            <div className="text-sm font-medium text-gray-900">{formatRoleName(user.role?.name)}</div>
            <p className="text-sm text-gray-500 mt-1">{user.role?.description || 'No role description'}</p>
          </Section>

          <Section title="Permissions" icon={Key}>
            {permissions.length === 0 ? (
              <p className="text-sm text-gray-500">No permissions assigned.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {permissions.map((permission) => (
                  <span key={permission.id} className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                    {formatRoleName(permission.name)}
                  </span>
                ))}
              </div>
            )}
          </Section>

          <Section title="Badges" icon={Award}>
            {badges.length === 0 ? (
              <p className="text-sm text-gray-500">No badges unlocked.</p>
            ) : (
              <div className="space-y-3">
                {badges.map((badge) => (
                  <div key={badge.id} className="bg-gray-50 p-3">
                    <div className="text-sm font-medium text-gray-900">{badge.name}</div>
                    <p className="text-xs text-gray-500 mt-1">{badge.description || 'No description'}</p>
                    <p className="text-xs font-medium text-amber-700 mt-2">
                      {badge.bonus_points ?? 0} bonus points
                    </p>
                    {badge.unlocked_at && (
                      <p className="text-xs text-gray-400 mt-2">
                        Unlocked {new Date(badge.unlocked_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        <Section title="Addresses" icon={Home}>
          {addresses.length === 0 ? (
            <p className="text-sm text-gray-500">No addresses saved.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((address) => (
                <div key={address.id} className="bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-gray-900">{address.name}</h3>
                    {address.is_default && (
                      <span className="px-2 py-1 text-xs bg-primary/10 text-primary">Default</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-start gap-2 text-sm text-gray-700">
                    <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <span>{formatLocationLine(address)}</span>
                  </div>
                  {formatAddressEntries(address.address).length > 0 && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {formatAddressEntries(address.address).map((entry) => (
                        <div key={entry.label} className="bg-white px-3 py-2">
                          <div className="text-[11px] uppercase text-gray-400">{entry.label}</div>
                          <div className="text-sm text-gray-900 mt-0.5">{entry.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
                    {address.latitude && <span className="bg-white px-2 py-1">Lat {address.latitude}</span>}
                    {address.longitude && <span className="bg-white px-2 py-1">Lng {address.longitude}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}

const Section = ({ title, icon, children }) => {
  const SectionIcon = icon

  return (
    <section className="bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <SectionIcon className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  )
}

const formatLocationLine = (address) => {
  const parts = [address.city, address.county, address.region, address.country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : 'No location label'
}

const formatAddressEntries = (address = {}) => {
  if (!address || typeof address !== 'object' || Array.isArray(address)) return []

  return Object.entries(address)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
    .map(([key, value]) => ({
      label: key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase()),
      value: typeof value === 'object' ? Object.values(value).filter(Boolean).join(', ') : String(value),
    }))
    .filter((entry) => entry.value)
}

export default UserDetail
