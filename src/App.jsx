import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import ProtectedRoute from '@/guards/ProtectedRoute'
import PublicRoute from '@/guards/PublicRoute'
import RoleProtectedRoute from '@/guards/RoleProtectedRoute'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import OTP from '@/pages/OTP'
import Dashboard from '@/pages/Dashboard'
import Users from '@/pages/Users'
import Settings from '@/pages/Settings'
import Inventory from '@/pages/Inventory'
import NewInventory from '@/pages/Inventory/New'
import Products from '@/pages/Products'
import ProductDetail from '@/pages/Products/Detail'
import Categories from '@/pages/Categories'
import Warehouses from '@/pages/Warehouses'
import NewWarehouse from '@/pages/Warehouses/New'
import EditWarehouse from '@/pages/Warehouses/Edit'
import WarehouseDetail from '@/pages/Warehouses/Detail'
import Downtimes from '@/pages/Downtimes'
import Contacts from '@/pages/Contacts'
import BookingsAdmin from '@/pages/Bookings/Admin'
import BookingDetail from '@/pages/Bookings/Detail'
import MyBookings from '@/pages/Bookings/MyBookings'
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
                path="/signup"
                element={
                  <PublicRoute>
                    <Signup />
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
                <Route path="/settings" element={<Settings />} />
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
                      <Categories />
                    </RoleProtectedRoute>
                  }
                />
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
                  path="/bookings"
                  element={
                    <RoleProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                      <Outlet />
                    </RoleProtectedRoute>
                  }
                >
                  <Route index element={<BookingsAdmin />} />
                  <Route path=":id" element={<BookingDetail />} />
                </Route>
                <Route
                  path="/my-bookings"
                  element={
                    <RoleProtectedRoute allowedRoles={['STAFF']}>
                      <Outlet />
                    </RoleProtectedRoute>
                  }
                >
                  <Route index element={<MyBookings />} />
                  <Route path=":id" element={<BookingDetail />} />
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
