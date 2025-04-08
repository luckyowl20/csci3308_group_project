// routes/chat.js
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// GET /chat/:chatPartnerId? - Load chat page with optional chat partner
router.get('/:chatPartnerId?', isAuthenticated, async (req, res) => {
    const db = req.app.locals.db;
    const user = req.session.user;
    const userId = user.id;
    const username = req.session.user.username;

    // Get friend list for the logged-in user
    const friends = await db.any(
        `SELECT u.id, username
        FROM users u
        JOIN friends f ON f.friend_id = u.id
        WHERE f.user_id = $1`,
        [userId]
    );
    // console.log("Found friends for", username, friends);

    let chatPartner = null;
    let messages = [];
    const chatPartnerId = req.params.chatPartnerId;
    // console.log("Chat partner id:", chatPartnerId);
    if (chatPartnerId) {
        chatPartner = await db.oneOrNone('SELECT id, username FROM users WHERE id = $1', [chatPartnerId]);
        console.log("Found chat partner:", chatPartner);
        messages = await db.any(
        `SELECT * FROM messages
        WHERE (sender_id = $1 AND receiver_id = $2)
            OR (sender_id = $2 AND receiver_id = $1)
        ORDER BY sent_at ASC`,
        [userId, chatPartnerId]
        );
        // console.log("Found messages between users:", username, chatPartner.username, messages);

        // Attach currentUserId to each message object, this was giving issues before
        messages = messages.map(message => ({
            ...message,
            currentUserId: userId
        }));

    }
    
    // console.log("Rendering chat with:", chatPartner, userId)
    res.render('pages/chat', {
        friends,
        chatPartner,
        messages,
        currentUserId: userId
    });
});


// POST /chat/messages/send - Handle sending a new message
router.post('/messages/send', isAuthenticated, async (req, res) => {
    try {
      const db = req.app.locals.db;
      const senderId = req.session.user.id;  // Active user's ID from the session
      const { receiver_id, message_text } = req.body; // Data from the form submission
      
      console.log("User:", senderId, "sending message to:", receiver_id, "message:", message_text);
  
      // Basic validation to ensure required fields are provided
      if (!receiver_id || !message_text) {
        return res.status(400).json({ error: 'Missing fields: receiver_id and message_text are required.' });
      }
  
      // Insert the new message into the database with a conversation_type of 'friend'
      const insertQuery = `
        INSERT INTO messages (sender_id, receiver_id, content, conversation_type)
        VALUES ($1, $2, $3, 'friend')
        RETURNING id, sender_id, receiver_id, content, sent_at;
      `;
      const result = await db.one(insertQuery, [senderId, receiver_id, message_text]);
  
      // Send back a JSON response with the newly created message
      // console.log("message success");
      res.json({ success: true, message: result });
    } catch (err) {
      console.error('Error sending message:', err);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });
  

module.exports = router;
