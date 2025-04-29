// routes/swipe.js
const express = require('express');
const router = express.Router();
const { calculateMatches } = require('../utils/matcher');
const { isAuthenticated } = require('../middleware/auth');


router.get('/', isAuthenticated, async (req, res) => {
  const user = req.session.user;
  const userId = user.id;
  const db = req.app.locals.db;

  console.log(`[SwipeDebug] Swipe page requested by user ID: ${userId}`);

  // Get the full logged-in user details first (for nav bar)
  const loggedInUser = await db.oneOrNone(`
      SELECT 
        u.id AS user_id,
        u.username, 
        p.*
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      WHERE u.id = $1
    `, [userId]);

  if (!loggedInUser) {
    console.error('Could not find logged in user details');
    return res.redirect('/auth/login');
  }

  console.log(`[SwipeDebug] attempting to find matches`);
  const { matches } = await calculateMatches(
    db,
    userId,
    'romantic'
  );

  console.log(`[SwipeDebug] Found ${matches?.length || 0} potential matches`);

  if (!matches?.length) {
    console.log('[SwipeDebug] No users left to swipe on');
    return res.render('pages/swipe', {
      noUsersLeft: true,
      // IMPORTANT: For nav compatibility, pass logged in user details in the way nav expects it
      user: loggedInUser,
      // Add swipeTarget as null to indicate no users to swipe on
      swipeTarget: null,
      currentUser: user
    });
  }

  const topMatch = await db.oneOrNone(`
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

  console.log(`[SwipeDebug] Top match selected:`, topMatch);

  res.render('pages/swipe', {
    // IMPORTANT: Keep logged-in user details for the navbar as 'user'
    user: loggedInUser,
    // Pass the potential match as a separate variable
    swipeTarget: { ...topMatch, match_score: matches[0].finalScore },
    noUsersLeft: false,
    currentUser: user
  });

});

// POST /swipe/swipe - Handles swipe actions
router.post('/swipe', isAuthenticated, async (req, res) => {
  console.log("[SwipeDebug] MADE IT TO POST");
  const user = req.session.user;
  const userId = user.id;
  const db = req.app.locals.db;
  console.log(`[SwipeDebug] Swipe action received from user ID: ${userId}`);

  const { swipeeId, isLiked } = req.body;
  const swiperId = userId;

  console.log(`[SwipeDebug] Swipe initiated: swiper=${swiperId}, swipee=${swipeeId}, isLiked=${isLiked}`);

  if (!swipeeId || isNaN(parseInt(swipeeId))) {
    console.warn('[SwipeDebug] Invalid swipeeId received:', swipeeId);
    return res.status(400).json({
      success: false,
      message: "Invalid user ID"
    });
  }

  // this should not exist ever in any codebase and hurts my sould -matt
  const isLikedBool = isLiked === true || isLiked === 'true';
  const swipeType = 'match';

  console.log(`[SwipeDebug] Recording swipe of type "${swipeType}"`);

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
         VALUES ($1, $2, $3, 'match')`,
      [swiperId, swipeeId, isLikedBool]
    );

    console.log('[SwipeDebug] Swipe recorded in DB');

    if (isLikedBool) {
      const match = await t.oneOrNone(
        `SELECT 1 FROM swipes 
           WHERE swiper_id = $1 AND swipee_id = $2 AND is_liked = true`,
        [swipeeId, swiperId]
      );

      if (match) {
        console.log('[SwipeDebug] Match found! Creating match & friendship');

        await t.none(
          `INSERT INTO matches (user_id, matched_user_id, matched_at) 
             VALUES ($1, $2, NOW()), ($2, $1, NOW())`,
          [swiperId, swipeeId]
        );

        return { isMatch: true };
      }
    }

    return { isMatch: false };
  }).then(result => {
    if (result.isMatch) {
      console.log(`[SwipeDebug] Match success between ${swiperId} and ${swipeeId}`);
      res.json({
        success: true,
        isMatch: true,
        message: "It's a match!"
      });
    } else {
      console.log(`[SwipeDebug] Swipe recorded without match`);
      res.json({
        success: true,
        isMatch: false,
        message: "Swipe recorded"
      });
    }
  });
});

module.exports = router;