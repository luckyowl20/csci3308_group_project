const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { getMatchesForUser } = require('../utils/matching');


router.get('/:type', isAuthenticated, async (req, res) => {
    const db = req.app.locals.db;
    const viewerId = req.session.user.id;
    const matchType = req.params.type; // 'friend' | 'romantic'
    try {
        // Eventually replace with actual match logic
        const matches = await getMatchesForUser(db, viewerId, matchType);

        res.render('pages/swipe2', {
            matches,                  // pass candidate list to template
            user: req.session.user,    // optional: pass logged in user info
            swipeType: matchType        // friend or romantic
        });
    } catch (err) {
        console.error('Failed to render swipe page:', err);
        res.status(500).send('Something went wrong');
    }
});

router.post('/:type', isAuthenticated, async (req, res) => {
    const db        = req.app.locals.db;
    const swiper_id = req.session.user.id;
    const swipe_type = req.params.type; // expect 'friend' or 'match'
    const { swipeeId, isLiked } = req.body;
  
    // 1️⃣ Validate swipe_type
    if (!['friend','match'].includes(swipe_type)) {
      return res.status(400).json({ success:false, message:'Invalid swipe type' });
    }
  
    // 2️⃣ Validate swipeeId and isLiked
    const swipee_id = parseInt(swipeeId,10);
    const liked     = (isLiked === true || isLiked === 'true');
    if (isNaN(swipee_id) || swipee_id === swiper_id) {
      return res.status(400).json({ success:false, message:'Invalid swipeeId' });
    }
  
    try {
      // 3️⃣ Insert or update the swipe record
      await db.none(`
        INSERT INTO swipes (swiper_id, swipee_id, is_liked, swipe_type)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (swiper_id, swipee_id)
        DO UPDATE SET is_liked = EXCLUDED.is_liked,
                      swipe_type = EXCLUDED.swipe_type,
                      swiped_at  = NOW()
      `, [swiper_id, swipee_id, liked, swipe_type]);
  
      return res.json({ success:true, message:'Swipe saved' });
    } catch (err) {
      console.error('Swipe-save error:', err);
      return res.status(500).json({ success:false, message:'Database error' });
    }
  });

module.exports = router;