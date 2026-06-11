const express = require('express');
const router = express.Router();

const {
  getConversations,
  getOrCreateConversation,
  getConversation,
  getMessages,
  sendMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// GET /api/messages/conversations — list all conversations for current user
router.get('/conversations', protect, getConversations);

// GET /api/messages/conversations/:userId/find-or-create — find or create conversation
// Note: this must come BEFORE /conversations/:conversationId to avoid param conflict
router.get('/conversations/:userId/find-or-create', protect, getOrCreateConversation);

// GET /api/messages/conversations/:conversationId — get single conversation
router.get('/conversations/:conversationId', protect, getConversation);

// GET /api/messages/conversations/:conversationId/messages — get messages
router.get('/conversations/:conversationId/messages', protect, getMessages);

// POST /api/messages/conversations/:conversationId/messages — send message
router.post('/conversations/:conversationId/messages', protect, sendMessage);

module.exports = router;
