import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, MessageCircle } from 'lucide-react';
import ChatWindow from '../components/ChatWindow';
import { messagesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function Messages() {
  const { conversationId: urlConvId } = useParams();
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(urlConvId || null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'

  useEffect(() => {
    const load = async () => {
      try {
        const res = await messagesAPI.getConversations();
        setConversations(res.data?.conversations || res.data || []);
      } catch {
        toast.error('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Listen for new messages to update conversation list
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === msg.conversationId
            ? { ...conv, lastMessage: msg.content, lastMessageAt: msg.createdAt }
            : conv
        )
      );
    };
    socket.on('receive_message', handleNewMessage);
    return () => socket.off('receive_message', handleNewMessage);
  }, [socket]);

  const handleSelectConversation = (conv) => {
    setActiveConvId(conv._id);
    navigate(`/messages/${conv._id}`, { replace: true });
    setMobileView('chat');
  };

  const activeConversation = conversations.find((c) => c._id === activeConvId);
  const recipient = activeConversation?.participants?.find((p) => p._id !== user?._id);

  const filteredConversations = conversations.filter((conv) => {
    const other = conv.participants?.find((p) => p._id !== user?._id);
    return other?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-16 flex flex-col" style={{ height: '100vh' }}>
      <div className="flex flex-1 overflow-hidden max-w-6xl mx-auto w-full">
        {/* Sidebar: Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 flex flex-col ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Messages</h2>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <MessageCircle size={40} className="text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center px-4">
                  {searchQuery ? 'No conversations found' : 'No messages yet. Start a conversation from a freelancer profile.'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = conv.participants?.find((p) => p._id !== user?._id);
                const isOnline = onlineUsers?.has(other?._id);
                const isActive = conv._id === activeConvId;
                return (
                  <button
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left ${isActive ? 'bg-green-50 dark:bg-green-900/10 border-r-2 border-green-500' : ''}`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                        {other?.avatar ? <img src={other.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : other?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      {isOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white text-sm truncate">{other?.name}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ''}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {conv.lastMessage || 'Start a conversation'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
          {activeConvId && recipient ? (
            <>
              {/* Mobile back button */}
              <div className="md:hidden flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <button onClick={() => { setMobileView('list'); }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                  <ChevronLeft size={22} />
                </button>
                <span className="font-semibold text-gray-900 dark:text-white">{recipient?.name}</span>
              </div>
              <ChatWindow
                conversationId={activeConvId}
                recipientId={recipient?._id}
                recipientName={recipient?.name}
                recipientAvatar={recipient?.avatar}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle size={36} className="text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select a Conversation</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Choose a conversation from the list to start messaging</p>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
