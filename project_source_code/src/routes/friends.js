// routes/friends.js
const express = require('express');
const router = express.Router();
const { getMatches } = require('../utils/matchAdapter');

router.get('/', async (req, res) => {
  try {
    if (!req.session.user) {
      console.log('No user session found — redirecting to login');
      return res.redirect('/auth/login');
    }

    console.log(`Friends page requested by user ID: ${req.session.user.id}`);

    const { matches } = await getMatches(
      req.app.locals.db,
      req.session.user.id,
      'friend'
    );

    console.log(`Found ${matches?.length || 0} potential friends`);

    if (!matches?.length) {
      console.log('No users left to swipe on');
      return res.render('pages/friends', {
        noUsersLeft: true,
        currentUser: req.session.user
      });
    }

    const topFriend = await req.app.locals.db.oneOrNone(`
      SELECT 
        u.*, 
        p.*,
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
    `, [matches[0].candidate.id]);

    console.log(`Top friend selected:`, topFriend);

    res.render('pages/friends', {
      user: { ...topFriend, match_score: matches[0].finalScore },
      noUsersLeft: false,
      currentUser: req.session.user
    });

  } catch (error) {
    console.error('FRIENDS PAGE ERROR:', {
      message: error.message,
      stack: error.stack,
      user: req.session.user
    });
    res.status(500).render('pages/friends', {
      noUsersLeft: true,
      currentUser: req.session.user
    });
  }
});

// POST /friends/swipe - Handles friend swipe actions
router.post('/swipe', async (req, res) => {
  try {
    if (!req.session.user) {
      console.warn('Swipe attempt without authentication');
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { swipeeId, isLiked } = req.body;
    const swiperId = req.session.user.id;

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

    await req.app.locals.db.tx(async t => {
      const swipeeExists = await t.oneOrNone(
        'SELECT 1 FROM users WHERE id = $1',
        [swipeeId]
      );

      if (!swipeeExists) {
        throw new Error('User to swipe on does not exist');
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

  } catch (error) {
    console.error('Friend swipe processing failed:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      user: req.session.user
    });
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;