const jwt = require('jsonwebtoken');
const User = require('../models/User');

const onlineUsers = new Map(); // userId -> socketId

const initSocket = (io) => {
  // Middleware: authenticate socket connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);

    // Update user lastSeen
    User.findByIdAndUpdate(userId, { lastSeen: new Date() }).exec();

    // Broadcast online users list
    io.emit('online_users', Array.from(onlineUsers.keys()));

    console.log(`User connected: ${socket.user.name} (${socket.id})`);

    // Join personal room for notifications
    socket.join(`user:${userId}`);

    // Join conversation room
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
    });

    // Leave conversation room
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      const { conversationId, recipientId, content, attachments } = data;

      const messageData = {
        conversationId,
        sender: userId,
        senderName: socket.user.name,
        senderAvatar: socket.user.avatar,
        content,
        attachments: attachments || [],
        createdAt: new Date(),
      };

      // Emit to conversation room
      socket.to(conversationId).emit('receive_message', messageData);

      // Also emit to recipient's personal room if not in conversation
      if (recipientId) {
        socket.to(`user:${recipientId}`).emit('receive_message', messageData);
      }
    });

    // Handle typing indicator
    socket.on('typing', ({ conversationId, recipientId }) => {
      socket.to(conversationId).emit('user_typing', {
        userId,
        name: socket.user.name,
      });
      if (recipientId) {
        socket.to(`user:${recipientId}`).emit('user_typing', {
          userId,
          name: socket.user.name,
        });
      }
    });

    // Handle stop typing
    socket.on('stop_typing', ({ conversationId, recipientId }) => {
      socket.to(conversationId).emit('user_stop_typing', { userId });
      if (recipientId) {
        socket.to(`user:${recipientId}`).emit('user_stop_typing', { userId });
      }
    });

    // Mark messages as read
    socket.on('mark_read', ({ conversationId, senderId }) => {
      if (senderId) {
        socket.to(`user:${senderId}`).emit('messages_read', {
          conversationId,
          readBy: userId,
        });
      }
    });

    // Send notification to specific user
    socket.on('notification_send', ({ recipientId, notification }) => {
      socket.to(`user:${recipientId}`).emit('new_notification', notification);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      User.findByIdAndUpdate(userId, { lastSeen: new Date() }).exec();
      io.emit('online_users', Array.from(onlineUsers.keys()));
      console.log(`User disconnected: ${socket.user.name} (${socket.id})`);
    });
  });
};

const getSocketId = (userId) => {
  return onlineUsers.get(userId.toString());
};

const emitToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

module.exports = { initSocket, getSocketId, emitToUser };
