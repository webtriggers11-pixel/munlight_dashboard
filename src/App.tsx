import { Navigate, Route, Routes } from "react-router-dom"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/layouts/dashboard-layout"
import LoginPage from "@/pages/login"
import DashboardPage from "@/pages/dashboard"
import OrdersPage from "@/pages/orders"
import ProductsPage from "@/pages/products"
import CategoriesPage from "@/pages/categories"
import UsersPage from "@/pages/users"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
