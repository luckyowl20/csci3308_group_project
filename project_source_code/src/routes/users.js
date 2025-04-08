const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// the /users part of this endpoint is taken care of when we mount it in index.js using:
// app.use('/users', userRoutes);
router.get('/:id', isAuthenticated, async (req, res) => {
    const db = req.app.locals.db;
    const viewerId = req.session.user.id;
    const targetId = parseInt(req.params.id);

    try {
        // 🔐 Check if viewer is friends with the target user
        const isFriend = await db.oneOrNone(`
            SELECT 1 FROM friends
            WHERE user_id = $1 AND friend_id = $2
            `, [viewerId, targetId]
        );

        console.log("is friend check for user:", viewerId, isFriend);

        if (!isFriend) {
            return res.status(403).send('You can only view your own friends\' profiles.');
        }

        // Load profile and photos of the target friend
        const profile = await db.oneOrNone(`
            SELECT * FROM profiles WHERE user_id = $1
            `, [targetId]
        );
        
        console.log("loaded profile of friend:", profile);

        const recentPhotos = await db.any(`
            SELECT photos.url, photos.description, posts.created_at
            FROM posts
            JOIN photos ON posts.photo_id = photos.id
            WHERE posts.user_id = $1
                AND posts.created_at >= NOW() - INTERVAL '7 days'
            ORDER BY posts.created_at DESC
            `, [targetId]
        );

        console.log("loaded photos of friend", recentPhotos);

        // Don't fetch or show friends-of-friends
        const friends = []; // Leave this blank or undefined intentionally

        res.render('pages/profile', {
            layout: 'main',
            profile,
            recentPhotos,
            friends,
            user: req.session.user,
            isOwnProfile: false
        });

    } catch (err) {
        console.error('Error loading friend profile:', err);
        res.status(500).send('Something went wrong loading the profile.');
    }
});

module.exports = router;
