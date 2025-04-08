// routes/swipe.js
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        if (!req.session.user) return res.redirect('/auth/login');

        const users = await req.app.locals.db.any(`
            SELECT u.id, p.display_name, p.profile_picture_url 
            FROM profiles p
            JOIN users u ON p.user_id = u.id
            WHERE u.id != $1  // Never show current user
            AND u.id NOT IN (
                SELECT swipee_id FROM swipes WHERE swiper_id = $1  // Exclude already swiped users
            )
            AND p.user_id != $1  // Extra protection
            AND u.id IS NOT NULL  // Ensure valid user
            ORDER BY RANDOM()
            LIMIT 1
        `, [req.session.user.id]);

        if (users.length === 0) {
            return res.render('pages/swipe', { noUsersLeft: true });
        }

        res.render('pages/swipe', { 
            user: users[0],
            noUsersLeft: false 
        });
    } catch (error) {
        console.error('Swipe error:', error);
        res.status(500).send('Server error');
    }
});


router.post('/swipe', async (req, res) => {
    try {
        // Debug logging
        console.log('Swipe request from:', req.session.user?.id, 'on:', req.body.swipeeId);
        
        if (!req.session.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const { swipeeId, isLiked } = req.body;
        const swiperId = req.session.user.id;

        // Validation
        if (swiperId == swipeeId) {
            console.error('Self-swipe attempt by user:', swiperId);
            return res.status(400).json({ 
                success: false, 
                message: "Cannot swipe on yourself" 
            });
        }

        if (isNaN(parseInt(swipeeId))) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid user ID" 
            });
        }

        // Record swipe
        await req.app.locals.db.none(
            `INSERT INTO swipes (swiper_id, swipee_id, is_liked, swipe_type) 
             VALUES ($1, $2, $3, 'match')`,
            [swiperId, swipeeId, isLiked === 'true']
        );

        // Check for match
        if (isLiked === 'true') {
            const match = await req.app.locals.db.oneOrNone(
                `SELECT 1 FROM swipes 
                 WHERE swiper_id = $1 AND swipee_id = $2 AND is_liked = true`,
                [swipeeId, swiperId]
            );

            if (match) {
                await req.app.locals.db.none(
                    `INSERT INTO matches (user_id, matched_user_id) 
                     VALUES ($1, $2), ($2, $1)`,
                    [swiperId, swipeeId]
                );
                return res.json({ 
                    success: true, 
                    isMatch: true,
                    message: "It's a match!" 
                });
            }
        }

        res.json({ 
            success: true, 
            isMatch: false,
            message: "Swipe recorded" 
        });
    } catch (error) {
        console.error('Swipe processing failed:', {
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