// routes/memories.js
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.session.user.id;

  try {
    const photos = await db.any(`
      SELECT photos.url, photos.description, posts.created_at
      FROM posts
      JOIN photos ON posts.photo_id = photos.id
      WHERE posts.user_id = $1
      ORDER BY posts.created_at DESC
    `, [userId]);

    res.render('pages/memories', {
      layout: 'main',
      photos,
      user: req.session.user
    });
  } catch (err) {
    console.error('Error loading memories:', err);
    res.status(500).send('Something went wrong loading your memories.');
  }
});

module.exports = router;
