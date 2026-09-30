import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import ProtectedRoute from '@/guards/ProtectedRoute'
import PublicRoute from '@/guards/PublicRoute'
import RoleProtectedRoute from '@/guards/RoleProtectedRoute'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import OTP from '@/pages/OTP'
import Dashboard from '@/pages/Dashboard'
import Users from '@/pages/Users'
import UserDetail from '@/pages/Users/Detail'
import Settings from '@/pages/Settings'
import DeliverySettings from '@/pages/DeliverySettings'
import Affiliates from '@/pages/Affiliates'
import AffiliateWithdrawals from '@/pages/AffiliateWithdrawals'
import Transactions from '@/pages/Transactions'
import Inventory from '@/pages/Inventory'
import NewInventory from '@/pages/Inventory/New'
import Products from '@/pages/Products'
import ProductDetail from '@/pages/Products/Detail'
import Categories from '@/pages/Categories'
import CategoryDetail from '@/pages/Categories/Detail'
import Warehouses from '@/pages/Warehouses'
import NewWarehouse from '@/pages/Warehouses/New'
import EditWarehouse from '@/pages/Warehouses/Edit'
import WarehouseDetail from '@/pages/Warehouses/Detail'
import Downtimes from '@/pages/Downtimes'
import Contacts from '@/pages/Contacts'
import OrdersAdmin from '@/pages/Orders/Admin'
import OrderDetail from '@/pages/Orders/Detail'
import MyOrders from '@/pages/Orders/MyOrders'
import Support from '@/pages/Support'
import SupportDetail from '@/pages/Support/Detail'
import NotFound from '@/pages/NotFound'
import ResetPassword from '@/pages/ResetPassword'

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/otp"
                element={
                  <PublicRoute>
                    <OTP />
                  </PublicRoute>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <PublicRoute>
                    <ResetPassword />
                  </PublicRoute>
                }
              />
              <Route
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Outlet />
                    </Layout>
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/users" element={<Users />} />
                <Route path="/users/:id" element={<UserDetail />} />
                <Route path="/settings" element={<Settings />} />
                <Route
                  path="/delivery-settings"
                  element={
                    <RoleProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                      <DeliverySettings />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/affiliates"
                  element={
                    <RoleProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                      <Affiliates />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/affiliate-withdrawals"
                  element={
                    <RoleProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                      <AffiliateWithdrawals />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/transactions"
                  element={
                    <RoleProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                      <Transactions />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <RoleProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                      <Outlet />
                    </RoleProtectedRoute>
                  }
                >
                  <Route index element={<Inventory />} />
                  <Route path="new" element={<NewInventory />} />
                  <Route path="products" element={<Products />} />
                  <Route path=":id" element={<ProductDetail />} />
                </Route>
                <Route
                  path="/categories"
                  element={
                    <RoleProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                      <Outlet />
                    </RoleProtectedRoute>
                  }
                >
                  <Route index element={<Categories />} />
                  <Route path=":id" element={<CategoryDetail />} />
                </Route>
                <Route
                  path="/spaces"
                  element={
                    <RoleProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                      <Outlet />
                    </RoleProtectedRoute>
                  }
                >
                  <Route index element={<Warehouses />} />
                  <Route path="new" element={<NewWarehouse />} />
                  <Route path=":id" element={<WarehouseDetail />} />
                  <Route path=":id/edit" element={<EditWarehouse />} />
                </Route>
                <Route
                  path="/downtimes"
                  element={
                    <RoleProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                      <Downtimes />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/contacts"
                  element={
                    <RoleProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                      <Contacts />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <RoleProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                      <Outlet />
                    </RoleProtectedRoute>
                  }
                >
                  <Route index element={<OrdersAdmin />} />
                  <Route path=":id" element={<OrderDetail />} />
                </Route>
                <Route
                  path="/support"
                  element={
                    <RoleProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                      <Outlet />
                    </RoleProtectedRoute>
                  }
                >
                  <Route index element={<Support />} />
                  <Route path=":id" element={<SupportDetail />} />
                </Route>
                <Route
                  path="/my-orders"
                  element={
                    <RoleProtectedRoute allowedRoles={['STAFF']}>
                      <Outlet />
                    </RoleProtectedRoute>
                  }
                >
                  <Route index element={<MyOrders />} />
                  <Route path=":id" element={<OrderDetail />} />
                </Route>
              </Route>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
