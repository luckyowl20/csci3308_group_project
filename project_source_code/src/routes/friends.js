// routes/friends.js
const express = require('express');
const router = express.Router();
const { calculateMatches } = require('../utils/matcher');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
  const user = req.session.user;
  const userId = user.id;
  const db = req.app.locals.db;

  console.log(`Friends page requested by user ID: ${req.session.user.id}`);

  // Get the full logged-in user details first (for nav bar)
  const loggedInUser = await db.oneOrNone(`
        SELECT 
          u.*, 
          p.*
        FROM users u
        JOIN profiles p ON p.user_id = u.id
        WHERE u.id = $1
      `, [req.session.user.id]);

  if (!loggedInUser) {
    console.error('Could not find logged in user details');
    return res.redirect('/auth/login');
  }


  const { matches } = await calculateMatches(
    db,
    userId,
    'friend'
  );

  console.log(`Found ${matches?.length || 0} potential friends`);

  if (!matches?.length) {
    console.log('No users left to swipe on');
    return res.render('pages/friends', {
      noUsersLeft: true,
      // IMPORTANT: For nav compatibility, pass logged in user details in the way nav expects it
      user: loggedInUser,
      // Add swipeTarget as null to indicate no users to swipe on
      swipeTarget: null,
      currentUser: user
    });
  }

  const topFriend = await db.oneOrNone(`
      SELECT 
        u.id AS user_id,
        u.username,
        p.id as profile_id,
        p.display_name,
        p.biography,
        p.birthday,
        p.profile_picture_url,
        (
          SELECT json_agg(subq.post_data)
          FROM (
            SELECT json_build_object(
              'id', pst.id,
              'title', pst.title,
              'body', pst.body,
              'photo_url', ph.url,
              'created_at', pst.created_at
            ) as post_data
            FROM posts pst
            LEFT JOIN photos ph ON ph.id = pst.photo_id
            WHERE pst.user_id = u.id
            AND pst.created_at >= NOW() - INTERVAL '7 days'
            ORDER BY pst.created_at DESC
            LIMIT 5
          ) subq
        ) as recent_posts
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      WHERE u.id = $1
    `, [matches[0].candidate.user_id]);

  console.log(`Top friend selected:`, topFriend);

  res.render('pages/friends', {
    // IMPORTANT: Keep logged-in user details for the navbar as 'user'
    user: loggedInUser,
    // Pass the potential match as a separate variable
    swipeTarget: { ...topFriend, match_score: matches[0].finalScore },
    noUsersLeft: false,
    currentUser: user
  });
});

// POST /friends/swipe - Handles friend swipe actions
router.post('/swipe', isAuthenticated, async (req, res) => {
  const user = req.session.user;
  const userId = user.id;
  const db = req.app.locals.db;

  const { swipeeId, isLiked } = req.body;
  const swiperId = userId;

  console.log(`Friend swipe initiated: swiper=${swiperId}, swipee=${swipeeId}, isLiked=${isLiked}`);

  if (!swipeeId || isNaN(parseInt(swipeeId))) {
    console.warn('Invalid swipeeId received:', swipeeId);
    return res.status(400).json({
      success: false,
      message: "Invalid user ID"
    });
  }

  const isLikedBool = isLiked === true || isLiked === 'true';
  const swipeType = 'friend';

  console.log(`Recording friend swipe of type "${swipeType}"`);

  await db.tx(async t => {
    const swipeeExists = await t.oneOrNone(
      'SELECT 1 FROM users WHERE id = $1',
      [swipeeId]
    );

    if (!swipeeExists) {
      throw Error('User to swipe on does not exist');
    }

    await t.none(
      `INSERT INTO swipes (swiper_id, swipee_id, is_liked, swipe_type) 
         VALUES ($1, $2, $3, 'friend')`,
      [swiperId, swipeeId, isLikedBool]
    );

    console.log('Friend swipe recorded in DB');

    if (isLikedBool) {
      const friend = await t.oneOrNone(
        `SELECT 1 FROM swipes 
           WHERE swiper_id = $1 AND swipee_id = $2 AND is_liked = true`,
        [swipeeId, swiperId]
      );

      if (friend) {
        console.log('Friend connection made! Creating friendship');

        await t.none(
          `INSERT INTO friends (user_id, friend_id, created_at)
             VALUES ($1, $2, NOW()), ($2, $1, NOW())
             ON CONFLICT (user_id, friend_id) DO NOTHING`,
          [swiperId, swipeeId]
        );

        return { isFriend: true }; // Changed from isMatch to isFriend
      }
    }

    return { isFriend: false }; // Changed from isMatch to isFriend
  }).then(result => {
    if (result.isFriend) {
      console.log(`Friend connection success between ${swiperId} and ${swipeeId}`);
      res.json({
        success: true,
        isFriend: true, // Changed from isMatch to isFriend
        message: "You're now friends."
      });
    } else {
      console.log(`Friend swipe recorded`);
      res.json({
        success: true,
        isFriend: false, // Changed from isMatch to isFriend
        message: "Friend swipe recorded"
      });
    }
  });
});

module.exports = router;