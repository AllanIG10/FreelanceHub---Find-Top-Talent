import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Bell, Briefcase, MessageSquare, CheckCircle, AlertCircle, Info, Check, BellOff } from 'lucide-react'
import { useSocket } from '../context/SocketContext'
import { formatDistanceToNow } from '../utils/dateUtils'

const typeConfig = {
  proposal: { icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', href: '/proposals' },
  message: { icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', href: '/messages' },
  accepted: { icon: CheckCircle, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-900/20', href: '/proposals' },
  rejected: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', href: '/proposals' },
  shortlisted: { icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', href: '/proposals' },
  default: { icon: Info, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-700', href: '/' },
}

function NotificationDropdown({ onClose }) {
  const navigate = useNavigate()
  const { notifications, markNotificationRead, markAllNotificationsRead, unreadCount } = useSocket()

  const handleClick = (notif) => {
    markNotificationRead(notif._id)
    const config = typeConfig[notif.type] || typeConfig.default
    navigate(notif.href || config.href)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-brand-500 text-white text-xs font-bold rounded-full">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 font-medium"
          >
            <Check className="w-3 h-3" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
              <BellOff className="w-7 h-7 text-gray-300 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No notifications yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">We'll notify you when something happens</p>
          </div>
        ) : (
          notifications.slice(0, 15).map((notif) => {
            const config = typeConfig[notif.type] || typeConfig.default
            const IconComponent = config.icon
            return (
              <motion.button
                key={notif._id}
                onClick={() => handleClick(notif)}
                whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                className={`w-full text-left flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  !notif.read ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''
                }`}
              >
                {/* Icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                  <IconComponent className={`w-4 h-4 ${config.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${notif.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'} line-clamp-1`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                    {notif.createdAt ? formatDistanceToNow(notif.createdAt) : 'Just now'}
                  </p>
                </div>

                {/* Unread dot */}
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1" />
                )}
              </motion.button>
            )
          })
        )}
      </div>

      {notifications.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            className="text-xs text-brand-500 hover:text-brand-600 font-medium"
          >
            View all notifications →
          </button>
        </div>
      )}
    </motion.div>
  )
}

export default NotificationDropdown
