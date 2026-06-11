import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user, token } = useAuth()
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [notifications, setNotifications] = useState([])
  const socketRef = useRef(null)

  useEffect(() => {
    if (user && token) {
      // Create socket connection with auth token
      const newSocket = io('/', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      })

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id)
      })

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected')
      })

      newSocket.on('online_users', (users) => {
        setOnlineUsers(new Set(users))
      })

      newSocket.on('user_online', (userId) => {
        setOnlineUsers(prev => new Set([...prev, userId]))
      })

      newSocket.on('user_offline', (userId) => {
        setOnlineUsers(prev => {
          const next = new Set(prev)
          next.delete(userId)
          return next
        })
      })

      newSocket.on('new_notification', (notification) => {
        setNotifications(prev => [notification, ...prev])
      })

      newSocket.on('connect_error', (err) => {
        console.warn('Socket connection error:', err.message)
      })

      socketRef.current = newSocket
      setSocket(newSocket)

      return () => {
        newSocket.disconnect()
        socketRef.current = null
        setSocket(null)
        setOnlineUsers(new Set())
      }
    } else {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
        setOnlineUsers(new Set())
      }
    }
  }, [user, token])

  const isUserOnline = (userId) => onlineUsers.has(userId)

  const markNotificationRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, read: true } : n)
    )
  }

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const value = {
    socket,
    onlineUsers,
    isUserOnline,
    notifications,
    setNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    unreadCount,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export default SocketContext
