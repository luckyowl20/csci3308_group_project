/*const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// GET /explore - Show the main explore page
router.get('/', isAuthenticated, async (req, res) => {
  try {
    res.render('pages/home');
  } catch (err) {
    console.error('Error loading home page:', err);
    res.status(500).send('Something went wrong loading the home page.');
  }
});

module.exports = router; */

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// GET /explore - Show Instagram-style feed
router.get('/', isAuthenticated, async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.session.user.id;

  try {
    // Step 1: Get user's friends
    const friends = await db.any(`
      SELECT u.id, u.username, p.display_name, p.profile_picture_url
      FROM friends f
      JOIN users u ON f.friend_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE f.user_id = $1
    `, [userId]);

    // Step 2: For each friend, try to get their photo from today
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

    const feed = await Promise.all(friends.map(async friend => {
      const post = await db.oneOrNone(`
        SELECT photos.url
        FROM posts
        JOIN photos ON posts.photo_id = photos.id
        WHERE posts.user_id = $1
          AND DATE(posts.created_at) = $2
        ORDER BY posts.created_at DESC
        LIMIT 1
      `, [friend.id, today]);

      return {
        ...friend,
        todays_photo_url: post ? post.url : null
      };
    }));

    res.render('pages/home', {
      layout: 'main',
      user: req.session.user,
      feed
    });

  } catch (err) {
    console.error('Error loading home feed:', err);
    res.status(500).send('Something went wrong loading your feed.');
  }
});

module.exports = router;