// routes/swipe.js
const express = require('express');
const router = express.Router();

// routes/swipe.js
router.get('/', async (req, res) => {
    try {
        console.log("Current session user ID:", req.session.user?.id); // Debug
        
        if (!req.session.user) return res.redirect('/auth/login');

        // BULLETPROOF QUERY - CANNOT RETURN CURRENT USER
        const potentialMatches = await req.app.locals.db.any(`
        SELECT 
        u.id,
        p.display_name,
        u.username,
        p.profile_picture_url,
        p.biography,
        p.spotify_song_id,
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
    WHERE 
        u.id != $1 AND
        u.id NOT IN (
            SELECT swipee_id 
            FROM swipes 
            WHERE swiper_id = $1
        ) AND
        u.id NOT IN (
            SELECT friend_id 
            FROM friends 
            WHERE user_id = $1
        ) AND
        p.profile_picture_url IS NOT NULL
    ORDER BY RANDOM()
    LIMIT 1
    `, [req.session.user.id]);

        console.log("Query results:", potentialMatches); // Debug

        if (potentialMatches.length === 0) {
            return res.render('pages/swipe', { 
                noUsersLeft: true,
                currentUser: req.session.user 
            });
        }

        res.render('pages/swipe', {
            user: potentialMatches[0],
            noUsersLeft: false,
            currentUser: req.session.user
        });

    } catch (error) {
        console.error('SWIPE PAGE ERROR:', error);
        res.status(500).send('Server error');
    }
});

router.post('/swipe', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const { swipeeId, isLiked } = req.body;
        const swiperId = req.session.user.id;

        // Enhanced validation
        if (!swipeeId || isNaN(parseInt(swipeeId))) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid user ID" 
            }); 
        }

        // Convert isLiked to proper boolean
        const isLikedBool = isLiked === true || isLiked === 'true';
        
        // Determine swipe type based on action
        const swipeType = isLikedBool ? 'match' : 'friend';

        // Transaction to ensure data consistency
        await req.app.locals.db.tx(async t => {
            // Check if swipee exists
            const swipeeExists = await t.oneOrNone(
                'SELECT 1 FROM users WHERE id = $1',
                [swipeeId]
            );
            
            if (!swipeeExists) {
                throw new Error('User to swipe on does not exist');
            }

            // Record swipe with correct type and like status
            await t.none(
                `INSERT INTO swipes (swiper_id, swipee_id, is_liked, swipe_type) 
                 VALUES ($1, $2, $3, $4)`,
                [swiperId, swipeeId, isLikedBool, swipeType]
            );

            // Check for match only if it's a like
            if (isLikedBool) {
                const match = await t.oneOrNone(
                    `SELECT 1 FROM swipes 
                     WHERE swiper_id = $1 AND swipee_id = $2 AND is_liked = true`,
                    [swipeeId, swiperId]
                );

                if (match) {
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
                res.json({ 
                    success: true, 
                    isMatch: true,
                    message: "It's a match!" 
                });
            } else {
                res.json({ 
                    success: true, 
                    isMatch: false,
                    message: "Swipe recorded" 
                });
            }
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