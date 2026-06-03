import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  bills: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
  new: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>,
  vendor: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 7H4a1 1 0 00-1 1v10a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,
  buckets: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M7 6V4h10v2M19 6l-1 14H6L5 6"/></svg>,
  team: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  reports: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  signout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
}

export default function Layout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  const navItems = [
    { to: '/', label: 'Dashboard', icon: icons.dashboard, exact: true, roles: ['manager','salesperson','accounting'] },
    { to: '/bills', label: 'All due bills', icon: icons.bills, roles: ['manager','accounting'] },
    { to: '/bills/new', label: 'New due bill', icon: icons.new, roles: ['manager','salesperson'] },
    { to: '/vendor', label: 'My jobs', icon: icons.vendor, roles: ['vendor'] },
    { to: '/buckets', label: 'Manage buckets', icon: icons.buckets, roles: ['manager','accounting'] },
    { to: '/reports', label: 'Accounting report', icon: icons.reports, roles: ['manager','accounting'] },
    { to: '/team', label: 'Team & vendors', icon: icons.team, roles: ['manager'] },
    { to: '/settings', label: 'Settings', icon: icons.settings, roles: ['manager','accounting'] },
  ].filter(item => item.roles.includes(profile?.role))

  const SidebarContent = () => (
    <>
      <div className="sidebar-logo">
        <div className="logo-mark">DB</div>
        <div>
          <div className="logo-text">Due Bill Portal</div>
          <div className="logo-sub">{profile?.vendor_name || 'Dealership'}</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            {item.icon}{item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-user">
        <div className="user-avatar">{initials}</div>
        <div className="user-info">
          <div className="user-name">{profile?.full_name}</div>
          <div className="user-role">{profile?.role}</div>
        </div>
        <button className="signout-btn" title="Sign out" onClick={async () => { await signOut(); navigate('/login') }}>
          {icons.signout}
        </button>
      </div>
    </>
  )

  return (
    <div className="app-shell">
      <div className={`sidebar${mobileOpen ? ' open' : ''}`}><SidebarContent /></div>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <div className="main">
        <div className="mobile-header">
          <div className="logo-mark" style={{ width:28,height:28,fontSize:12 }}>DB</div>
          <button className="hamburger" onClick={() => setMobileOpen(!mobileOpen)}>{icons.menu}</button>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
