const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {

    console.log("clicked on profile");
    const db = req.app.locals.db;
    const userId = req.session.user.id;

    try {
        // loading the users profile information
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

        console.log("found profile:", profile);
        
        // loading the users friends
        const friends = await db.any(`
            SELECT users.id, users.username
            FROM friends
            JOIN users ON users.id = friends.friend_id
            WHERE friends.user_id = $1
          `, [userId]);
        
        console.log("found friends:", friends);

        // rendering the profile
        res.render('pages/profile', {
            layout: 'main',
            profile,
            recentPhotos,
            friends,
            user: req.session.user, // if you use it in nav bar or elsewhere
            isOwnProfile: true
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
    console.log("update called with song:", spotify_song_id)

    // cleaning some variables to prevent insertion errors
    const clean_birthday = birthday === '' ? null : birthday;
    const clean_song_id = spotify_song_id === '' ? null : spotify_song_id;

    // THIS WILL NEED TO BE REPLCED WITH AN IMAGE DATABASE QUERY
    const clean_profile_url = profile_picture_url === '' ? null : profile_picture_url;

    try {
        // Upsert pattern — insert or update if exists
        // this is done by ON CONFLICT and EXCLUDED means we want to set the attribute to the value we attempted to insert 
        // ON CONFLICT is used to prevent duplicates
        // EXCLUDED.column refers to the new column from the attempted insert (in values)
        await db.none(`
        INSERT INTO profiles (user_id, display_name, biography, interests, birthday, profile_picture_url, spotify_song_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            biography = EXCLUDED.biography,
            interests = EXCLUDED.interests,
            birthday = EXCLUDED.birthday,
            profile_picture_url = EXCLUDED.profile_picture_url,
            spotify_song_id = EXCLUDED.spotify_song_id
        `, [userId, display_name, biography, interests, clean_birthday, clean_profile_url, clean_song_id]);

        res.redirect('/profile');
    } catch (err) {
        console.error('Failed to update profile:', err);
        res.status(500).send('Error updating profile');
    }
});
  

module.exports = router;
