
export const hasRoleAccess = (allowedRoles, userRole) => {
  if (!userRole || !allowedRoles || allowedRoles.length === 0) {
    return false
  }
  return allowedRoles.includes(userRole)
}

export const getUserRole = (user) => {
  if (!user) return null
    if (user.role?.name) {
    return user.role.name.toUpperCase()
  }
    if (user.user_role) {
    return typeof user.user_role === 'string' ? user.user_role.toUpperCase() : user.user_role
  }
  
  return null
}
