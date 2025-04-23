// routes/memories.js
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.session.user.id;

  try {
    const photos = await db.any(`
      SELECT 
        posts.id AS post_id,
        photos.url, 
        photos.description AS caption, 
        posts.created_at,
        COUNT(pl.user_id) AS like_count
      FROM posts
      JOIN photos ON posts.photo_id = photos.id
      LEFT JOIN post_likes pl ON pl.post_id = posts.id
      WHERE posts.user_id = $1
      GROUP BY posts.id, photos.url, photos.description, posts.created_at
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