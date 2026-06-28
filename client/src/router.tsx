import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import LoginPage from './pages/LoginPage'
import OperatorPage from './pages/OperatorPage'
import QCHeadPage from './pages/QCHeadPage'
import ApproverPage from './pages/ApproverPage'
import InventoryPage from './pages/InventoryPage'
import type { UserRole } from './types'

function RoleRoute({ role, children }: { role: UserRole | UserRole[]; children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-8">Loading...</div>
  const allowed = Array.isArray(role) ? role : [role]
  if (!user || !allowed.includes(user.role)) return <Navigate to="/login" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/operator',
    element: <RoleRoute role={['operator', 'engineer']}><OperatorPage /></RoleRoute>,
  },
  {
    path: '/qc',
    element: <RoleRoute role="qc_head"><QCHeadPage /></RoleRoute>,
  },
  {
    path: '/approvals',
    element: <RoleRoute role="approver"><ApproverPage /></RoleRoute>,
  },
  {
    path: '/inventory',
    element: <RoleRoute role="inventory_manager"><InventoryPage /></RoleRoute>,
  },
  { path: '*', element: <Navigate to="/login" replace /> },
])
