import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Paperclip, Check, CheckCheck, Circle } from 'lucide-react'
import { messagesAPI } from '../services/api'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDay(date) {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function groupByDay(messages) {
  const groups = {}
  messages.forEach(msg => {
    const day = formatDay(msg.createdAt)
    if (!groups[day]) groups[day] = []
    groups[day].push(msg)
  })
  return groups
}

function ChatWindow({ conversationId, otherUser }) {
  const { user } = useAuth()
  const { socket, isUserOnline } = useSocket()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  // Load messages
  useEffect(() => {
    if (!conversationId) return
    setLoading(true)
    messagesAPI.getMessages(conversationId)
      .then(data => {
        setMessages(Array.isArray(data) ? data : data.messages || [])
        setTimeout(() => scrollToBottom(false), 100)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [conversationId])

  // Socket events
  useEffect(() => {
    if (!socket || !conversationId) return

    const handleReceive = (msg) => {
      if (msg.conversationId === conversationId) {
        setMessages(prev => [...prev, msg])
        setTimeout(scrollToBottom, 50)
      }
    }

    const handleTyping = ({ userId, conversationId: cId }) => {
      if (cId === conversationId && userId !== user._id) {
        setIsTyping(true)
        setTimeout(() => setIsTyping(false), 3000)
      }
    }

    const handleStopTyping = ({ userId, conversationId: cId }) => {
      if (cId === conversationId && userId !== user._id) {
        setIsTyping(false)
      }
    }

    socket.on('receive_message', handleReceive)
    socket.on('typing', handleTyping)
    socket.on('stop_typing', handleStopTyping)

    // Join conversation room
    socket.emit('join_conversation', conversationId)

    return () => {
      socket.off('receive_message', handleReceive)
      socket.off('typing', handleTyping)
      socket.off('stop_typing', handleStopTyping)
      socket.emit('leave_conversation', conversationId)
    }
  }, [socket, conversationId, user._id])

  const handleTyping = () => {
    if (!socket) return
    socket.emit('typing', { conversationId, userId: user._id })
    if (typingTimeout) clearTimeout(typingTimeout)
    setTypingTimeout(setTimeout(() => {
      socket.emit('stop_typing', { conversationId, userId: user._id })
    }, 2000))
  }

  const handleSend = async () => {
    if (!input.trim() || sending) return
    const content = input.trim()
    setInput('')
    setSending(true)

    // Optimistic update
    const tempMsg = {
      _id: `temp-${Date.now()}`,
      content,
      sender: { _id: user._id, name: user.name, avatar: user.avatar },
      createdAt: new Date().toISOString(),
      status: 'sending',
      conversationId,
    }
    setMessages(prev => [...prev, tempMsg])
    setTimeout(scrollToBottom, 50)

    try {
      const sent = await messagesAPI.sendMessage(conversationId, content)
      setMessages(prev => prev.map(m => m._id === tempMsg._id ? sent : m))
      if (socket) {
        socket.emit('send_message', { ...sent, conversationId })
        socket.emit('stop_typing', { conversationId, userId: user._id })
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m._id === tempMsg._id ? { ...m, status: 'failed' } : m
      ))
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isOnline = otherUser && isUserOnline(otherUser._id)
  const groupedMessages = groupByDay(messages)

  if (!conversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Send className="w-8 h-8 text-gray-300 dark:text-gray-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-700 dark:text-gray-300">No conversation selected</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose a conversation to start messaging</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="relative">
          {otherUser?.avatar ? (
            <img src={otherUser.avatar} alt={otherUser.name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold">
              {otherUser?.name?.charAt(0) || '?'}
            </div>
          )}
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{otherUser?.name || 'User'}</p>
          <p className={`text-xs ${isOnline ? 'text-green-500' : 'text-gray-400'}`}>
            {isOnline ? 'Online now' : 'Offline'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-1 bg-gray-50 dark:bg-gray-950">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {Object.entries(groupedMessages).map(([day, dayMessages]) => (
              <div key={day}>
                {/* Day separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 px-2">{day}</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>

                {dayMessages.map((msg, idx) => {
                  const isSent = msg.sender?._id === user._id || msg.sender === user._id
                  return (
                    <motion.div
                      key={msg._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-end gap-2 mb-2 ${isSent ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Other user avatar */}
                      {!isSent && (
                        <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 overflow-hidden mb-0.5">
                          {otherUser?.avatar
                            ? <img src={otherUser.avatar} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-blue-400 to-blue-600">
                                {otherUser?.name?.charAt(0)}
                              </div>
                          }
                        </div>
                      )}

                      <div className={`flex flex-col gap-0.5 ${isSent ? 'items-end' : 'items-start'} max-w-[75%]`}>
                        <div className={isSent ? 'message-bubble-sent' : 'message-bubble-received'}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                        <div className={`flex items-center gap-1 ${isSent ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatTime(msg.createdAt)}</span>
                          {isSent && (
                            msg.status === 'sending'
                              ? <Circle className="w-3 h-3 text-gray-400" />
                              : msg.status === 'read'
                              ? <CheckCheck className="w-3.5 h-3.5 text-brand-500" />
                              : <Check className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ))}

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="flex items-end gap-2 mb-2"
                >
                  <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                  <div className="message-bubble-received flex items-center gap-1 py-3 px-4">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-end gap-3">
          <button className="p-2 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); handleTyping() }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder-gray-400 dark:placeholder-gray-500 max-h-32 overflow-y-auto"
              style={{ minHeight: '42px' }}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="p-2.5 rounded-2xl bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-brand"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default ChatWindow
