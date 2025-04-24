/*const express = require('express');
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

module.exports = router; */
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// GET /home - Show home feed
router.get('/', isAuthenticated, async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.session.user.id;

  try {
    // Get user's profile info for form completion check
    const profile = await db.oneOrNone(
      `SELECT display_name, birthday, gender, preferred_gender, user_location
       FROM profiles WHERE user_id = $1`,
      [userId]
    );

    const profileIncomplete =
      !profile ||
      !profile.display_name ||
      !profile.birthday ||
      !profile.gender ||
      !profile.preferred_gender ||
      !profile.user_location;

    const friends = await db.any(
      `SELECT u.id, u.username, p.display_name, p.profile_picture_url
       FROM friends f
       JOIN users u ON f.friend_id = u.id
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE f.user_id = $1`,
      [userId]
    );

    const today = new Date().toISOString().slice(0, 10);

    const feed = await Promise.all(friends.map(async friend => {
      const post = await db.oneOrNone(
        `SELECT posts.id AS post_id, photos.url, photos.description
         FROM posts
         JOIN photos ON posts.photo_id = photos.id
         WHERE posts.user_id = $1
           AND DATE(posts.created_at) = $2
         ORDER BY posts.created_at DESC
         LIMIT 1`,
        [friend.id, today]
      );

      if (!post) return null;

      const likeCount = await db.one(`SELECT COUNT(*) FROM post_likes WHERE post_id = $1`, [post.post_id]);
      const likedByUser = await db.oneOrNone(`SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2`, [post.post_id, userId]);

      return {
        ...friend,
        post_id: post.post_id,
        todays_photo_url: post.url,
        todays_caption: post.description,
        like_count: parseInt(likeCount.count, 10),
        liked_by_user: !!likedByUser
      };
    }));

    const visibleFeed = feed.filter(Boolean);

    const selfPost = await db.oneOrNone(
      `SELECT photos.url
       FROM posts
       JOIN photos ON posts.photo_id = photos.id
       WHERE posts.user_id = $1
         AND DATE(posts.created_at) = $2
       ORDER BY posts.created_at DESC
       LIMIT 1`,
      [userId, today]
    );

    const userHasPostedToday = !!selfPost;

    res.render('pages/home', {
      layout: 'main',
      user: req.session.user,
      feed: visibleFeed,
      userHasPostedToday,
      profileIncomplete
    });

  } catch (err) {
    console.error('Error loading home feed:', err);
    res.status(500).send('Something went wrong loading your feed.');
  }
});

// POST /posts/:postId/like - Toggle like for a post
router.post('/posts/:postId/like', isAuthenticated, async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.session.user.id;
  const postId = parseInt(req.params.postId, 10);

  try {
    const existingLike = await db.oneOrNone(
      'SELECT * FROM post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    if (existingLike) {
      await db.none('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
    } else {
      await db.none('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)', [postId, userId]);
    }

    const { count } = await db.one('SELECT COUNT(*) FROM post_likes WHERE post_id = $1', [postId]);

    res.json({
      liked: !existingLike,
      likeCount: parseInt(count, 10)
    });

  } catch (err) {
    console.error('Error toggling like:', err);
    res.status(500).send('Something went wrong toggling the like.');
  }
});

module.exports = router;
