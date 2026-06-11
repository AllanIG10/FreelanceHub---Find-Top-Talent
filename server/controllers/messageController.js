const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { getSocketId } = require('../socket');

/**
 * @desc    Get all conversations for the current user
 * @route   GET /api/messages/conversations
 * @access  Private
 */
const getConversations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [conversations, total] = await Promise.all([
      Conversation.find({ participants: req.user._id, isActive: true })
        .populate('participants', 'name avatar title role lastSeen')
        .populate('jobId', 'title status')
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Conversation.countDocuments({ participants: req.user._id, isActive: true }),
    ]);

    // Attach unread count for current user
    const formatted = conversations.map((conv) => {
      const obj = conv.toObject();
      obj.myUnreadCount = conv.unreadCount?.get(req.user._id.toString()) || 0;
      obj.otherParticipant = obj.participants.find(
        (p) => p._id.toString() !== req.user._id.toString()
      );
      return obj;
    });

    res.status(200).json({
      success: true,
      data: formatted,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get or create a conversation between the current user and another user
 * @route   GET /api/messages/conversations/:userId/find-or-create
 * @access  Private
 */
const getOrCreateConversation = async (req, res, next) => {
  try {
    const otherUserId = req.params.userId;

    if (otherUserId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot create conversation with yourself.' });
    }

    const otherUser = await User.findById(otherUserId).select('name avatar title role');
    if (!otherUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Find existing conversation between these two participants
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, otherUserId], $size: 2 },
      isActive: true,
    })
      .populate('participants', 'name avatar title role lastSeen')
      .populate('jobId', 'title status');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, otherUserId],
        unreadCount: new Map(),
      });
      await conversation.populate('participants', 'name avatar title role lastSeen');
    }

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a specific conversation by ID
 * @route   GET /api/messages/conversations/:conversationId
 * @access  Private (participant)
 */
const getConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId)
      .populate('participants', 'name avatar title role lastSeen')
      .populate('jobId', 'title status budget');

    if (!conversation || !conversation.isActive) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this conversation.' });
    }

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get paginated messages in a conversation, mark them as read
 * @route   GET /api/messages/conversations/:conversationId/messages
 * @access  Private (participant)
 */
const getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isActive) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view messages.' });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      Message.find({ conversationId, deleted: false })
        .populate('sender', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Message.countDocuments({ conversationId, deleted: false }),
    ]);

    // Mark unread messages from others as read
    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: req.user._id },
        read: false,
      },
      { read: true, readAt: new Date() }
    );

    // Reset unread count for current user
    conversation.resetUnread(req.user._id);
    await conversation.save({ validateBeforeSave: false });

    // Return messages in chronological order
    const sortedMessages = messages.reverse();

    res.status(200).json({
      success: true,
      data: sortedMessages,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        hasNextPage: Number(page) < Math.ceil(total / Number(limit)),
        hasPrevPage: Number(page) > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send a message in a conversation
 * @route   POST /api/messages/conversations/:conversationId/messages
 * @access  Private (participant)
 */
const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content, attachments } = req.body;

    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ success: false, message: 'Message content or attachment is required.' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isActive) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized to send messages in this conversation.' });
    }

    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      content: content || '',
      attachments: attachments || [],
    });

    await message.populate('sender', 'name avatar');

    // Update conversation last message
    conversation.lastMessage = content ? content.substring(0, 100) : '📎 Attachment';
    conversation.lastMessageAt = new Date();

    // Increment unread count for all other participants
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== req.user._id.toString()) {
        conversation.incrementUnread(participantId);
      }
    });

    await conversation.save({ validateBeforeSave: false });

    // Emit socket event to all other participants
    const io = req.app.get('io');
    if (io) {
      conversation.participants.forEach((participantId) => {
        if (participantId.toString() !== req.user._id.toString()) {
          const socketId = getSocketId(participantId.toString());
          if (socketId) {
            io.to(socketId).emit('new_message', {
              message,
              conversationId,
            });
          }
        }
      });
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getOrCreateConversation,
  getConversation,
  getMessages,
  sendMessage,
};
