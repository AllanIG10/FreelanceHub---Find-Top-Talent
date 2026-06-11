import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Briefcase, FileText, MessageSquare, User,
  Users, BarChart2, Settings, LogOut, ChevronLeft, ChevronRight,
  Search, Sparkles, PlusCircle, Shield, TrendingUp
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const clientLinks = [
  { label: 'Overview', href: '/dashboard/client', icon: LayoutDashboard },
  { label: 'My Jobs', href: '/dashboard/client?tab=jobs', icon: Briefcase },
  { label: 'Proposals Received', href: '/dashboard/client?tab=proposals', icon: FileText },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'Profile', href: '/profile/edit', icon: User },
  { label: 'Post a Job', href: '/jobs/create', icon: PlusCircle },
]

const freelancerLinks = [
  { label: 'Overview', href: '/dashboard/freelancer', icon: LayoutDashboard },
  { label: 'Browse Jobs', href: '/jobs', icon: Search },
  { label: 'My Proposals', href: '/proposals', icon: FileText },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'AI Tools', href: '/dashboard/freelancer?tab=ai', icon: Sparkles },
  { label: 'Profile', href: '/profile/edit', icon: User },
]

const adminLinks = [
  { label: 'Overview', href: '/dashboard/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/dashboard/admin?tab=users', icon: Users },
  { label: 'Jobs', href: '/dashboard/admin?tab=jobs', icon: Briefcase },
  { label: 'Analytics', href: '/dashboard/admin?tab=analytics', icon: BarChart2 },
  { label: 'Settings', href: '/dashboard/admin?tab=settings', icon: Settings },
]

function Sidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const links = user?.role === 'client' ? clientLinks
    : user?.role === 'admin' ? adminLinks
    : freelancerLinks

  const isActive = (href) => {
    const path = href.split('?')[0]
    return location.pathname === path
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 overflow-hidden"
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(p => !p)}
        className="absolute -right-3 top-20 z-10 w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center text-gray-500 hover:text-brand-500 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-100 dark:border-gray-800">
        <div className="w-9 h-9 min-w-[36px] rounded-xl bg-brand-500 flex items-center justify-center shadow-brand">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap"
            >
              Freelance<span className="text-brand-500">Hub</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* User info */}
      <div className={`flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800 ${collapsed ? 'justify-center' : ''}`}>
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-10 h-10 min-w-[40px] rounded-full object-cover ring-2 ring-brand-500/30" />
        ) : (
          <div className="w-10 h-10 min-w-[40px] rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-hidden"
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {links.map((link) => {
          const active = isActive(link.href)
          return (
            <Link
              key={link.href + link.label}
              to={link.href}
              title={collapsed ? link.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                active
                  ? 'bg-brand-500 text-white shadow-brand'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <link.icon className={`w-5 h-5 min-w-[20px] ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    {link.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {link.badge && !collapsed && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {link.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: Logout */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign Out' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 min-w-[20px]" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  )
}

export default Sidebar
