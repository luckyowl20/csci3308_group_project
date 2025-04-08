const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {

    console.log("clicked on profile");
    const db = req.app.locals.db;
    const userId = req.session.user.id;

    try {
        const profile = await db.oneOrNone('SELECT * FROM profiles WHERE user_id = $1', [userId]);
        const recentPhotos = await db.any(
            `SELECT photos.url, photos.description, posts.created_at
             FROM posts
             JOIN photos ON posts.photo_id = photos.id
             WHERE posts.user_id = $1
               AND posts.created_at >= NOW() - INTERVAL '7 days'
             ORDER BY posts.created_at DESC`,
            [userId]
          );
          

        res.render('pages/profile', {
            layout: 'main',
            profile,
            recentPhotos,
            user: req.session.user // if you use it in nav bar or elsewhere
        });

    } catch (err) {
        console.error('Error loading profile:', err);
        res.status(500).send('Something went wrong loading the profile.');
    }
});

router.post('/update', isAuthenticated, async (req, res) => {
    const db = req.app.locals.db;
    const userId = req.session.user.id;
    const { display_name, biography, interests, birthday, profile_picture_url, spotify_song_id } = req.body;
    const clean_birthday = birthday === '' ? null : birthday;

    try {
        // Upsert pattern — insert or update if exists
        await db.none(`
        INSERT INTO profiles (user_id, display_name, biography, interests, birthday, profile_picture_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            biography = EXCLUDED.biography,
            interests = EXCLUDED.interests,
            birthday = EXCLUDED.birthday,
            profile_picture_url = EXCLUDED.profile_picture_url
        `, [userId, display_name, biography, interests, clean_birthday, profile_picture_url]);

        res.redirect('/profile');
    } catch (err) {
        console.error('Failed to update profile:', err);
        res.status(500).send('Error updating profile');
    }
});
  

module.exports = router;
