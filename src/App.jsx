import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewBill from './pages/NewBill'
import BillsList from './pages/BillsList'
import BillDetail from './pages/BillDetail'
import VendorPortal from './pages/VendorPortal'
import SettingsPage from './pages/SettingsPage'
import BucketsPage from './pages/BucketsPage'
import TeamPage from './pages/TeamPage'
import AccountingReport from './pages/AccountingReport'

function ProtectedRoute({ children, roles }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--text-3)' }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(profile?.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { user, profile, loading } = useAuth()

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--text-3)' }}>Loading...</div>

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="bills" element={<BillsList />} />
        <Route path="bills/new" element={<ProtectedRoute roles={['manager','salesperson']}><NewBill /></ProtectedRoute>} />
        <Route path="bills/:id" element={<BillDetail />} />
        <Route path="vendor" element={<ProtectedRoute roles={['vendor']}><VendorPortal /></ProtectedRoute>} />
        <Route path="buckets" element={<ProtectedRoute roles={['manager','accounting']}><BucketsPage /></ProtectedRoute>} />
        <Route path="team" element={<ProtectedRoute roles={['manager']}><TeamPage /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute roles={['manager','accounting']}><SettingsPage /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute roles={['manager','accounting']}><AccountingReport /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
