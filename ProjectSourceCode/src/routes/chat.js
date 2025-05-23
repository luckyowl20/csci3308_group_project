// routes/chat.js
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { getUserFriends, getUserMatches } = require('../utils/chatUtils');
// const app = require('..');

// for changing between friends and matches in the chat sidebar
router.get('/friends', isAuthenticated, async (req, res, next) => {
  const user = req.session.user;
  try {
    const friends = await getUserFriends(user.id);
    res.json({ friends });
  } catch (err) {
    next(err);
  }
});

router.get('/matches', isAuthenticated, async (req, res, next) => {
  const user = req.session.user;
  try {
    const matches = await getUserMatches(user.id);
    res.json({ matches });
  } catch (err) {
    next(err);
  }
});


// GET /chat/:chatPartnerId? - Load chat page with optional chat partner
router.get('/:chatPartnerId?', isAuthenticated, async (req, res) => {
  const db = req.app.locals.db;
  const user = req.session.user;
  const userId = user.id;
  const username = req.session.user.username;

  const friends = await db.any(
    `SELECT u.id, u.username, p.profile_picture_url
     FROM users u
     JOIN friends f ON f.friend_id = u.id
     LEFT JOIN (SELECT user_id, profile_picture_url FROM profiles) p ON p.user_id = u.id
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
    // console.log("Found chat partner:", chatPartner);
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
    currentUserId: userId,
    chatPartnerId: chatPartnerId
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

    // emit the new message to the receivers room
    const io = req.app.locals.io;

    // io.to(`user_${senderId}`).emit('new message', result); including this line creates double rendering
    // rendering of the client side message bubble is done in the chatScript.js file when the user submits the form
    // this message is the broadcasted to the receiver in the line below, including the sender in the socket emit also sends the message to the sender,
    // who already got the message since they are the one who sent it.
    io.to(`user_${receiver_id}`).emit('new message', result);

    // Send back a JSON response with the newly created message
    // console.log("message success");
    res.json({ success: true, message: result });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});




module.exports = router;
