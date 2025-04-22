const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
    const db = req.app.locals.db;
    const userId = req.session.user.id;

    try {
        const profile = await db.oneOrNone('SELECT * FROM profiles WHERE user_id = $1', [userId]);

        const selectedInterests = await db.any(`
            SELECT i.id, i.name FROM interests i
            JOIN user_interests ui ON i.id = ui.interest_id
            WHERE ui.user_id = $1
        `, [userId]);

        const recentPhotos = await db.any(`
            SELECT photos.url, photos.description AS caption, posts.created_at
            FROM posts
            JOIN photos ON posts.photo_id = photos.id
            WHERE posts.user_id = $1
              AND posts.created_at >= NOW() - INTERVAL '7 days'
            ORDER BY posts.created_at DESC
        `, [userId]);

        const friends = await db.any(`
            SELECT users.id, users.username
            FROM friends
            JOIN users ON users.id = friends.friend_id
            WHERE friends.user_id = $1
        `, [userId]);

        res.render('pages/profile', {
            layout: 'main',
            profile,
            recentPhotos,
            friends,
            user: req.session.user,
            isOwnProfile: true,
            selectedInterestsDetails: selectedInterests,
        });

    } catch (err) {
        console.error('Error loading profile:', err);
        res.status(500).send('Something went wrong loading the profile.');
    }
});

router.get('/search-interests', isAuthenticated, async (req, res) => {
    const db = req.app.locals.db;
    const query = req.query.q;

    try {
        const results = await db.any(
            `SELECT id, name FROM interests WHERE LOWER(name) LIKE $1 LIMIT 10`,
            [`%${query.toLowerCase()}%`]
        );
        res.json(results);
    } catch (err) {
        console.error('Error searching interests:', err);
        res.status(500).json({ error: 'Search failed' });
    }
});

router.get('/:id', isAuthenticated, async (req, res) => {
    const db = req.app.locals.db;
    const viewerId = req.session.user.id;
    const targetId = parseInt(req.params.id);

    try {
        const isFriend = await db.oneOrNone(`
            SELECT 1 FROM friends
            WHERE user_id = $1 AND friend_id = $2
        `, [viewerId, targetId]);

        if (!isFriend) {
            return res.status(403).send("You can only view your own friends' profiles.");
        }

        const profile = await db.oneOrNone(`
            SELECT
              p.id,
              p.user_id,
              p.display_name,
              p.biography,
              p.birthday,
              p.profile_picture_url,
              u.username
            FROM profiles p
            JOIN users u ON u.id = p.user_id
            WHERE p.user_id = $1
        `, [targetId]);

        const selectedInterests = await db.any(`
            SELECT i.id, i.name FROM interests i
            JOIN user_interests ui ON i.id = ui.interest_id
            WHERE ui.user_id = $1
        `, [targetId]);

        const recentPhotos = await db.any(`
            SELECT photos.url, photos.description AS caption, posts.created_at
            FROM posts
            JOIN photos ON posts.photo_id = photos.id
            WHERE posts.user_id = $1
              AND posts.created_at >= NOW() - INTERVAL '7 days'
            ORDER BY posts.created_at DESC
        `, [targetId]);

        const friends = [];

        res.render('pages/profile', {
            layout: 'main',
            profile,
            selectedInterestsDetails: selectedInterests,
            recentPhotos,
            friends,
            user: req.session.user,
            isOwnProfile: false,
        });

    } catch (err) {
        console.error('Error loading friend profile:', err);
        res.status(500).send('Something went wrong loading the profile.');
    }
});

router.post('/update', isAuthenticated, async (req, res) => {
    const db = req.app.locals.db;
    const user = req.session.user;
    const userId = user.id;
    const { display_name, biography, interests, birthday, profile_picture_url, spotify_song_id } = req.body;

    const clean_birthday = birthday && birthday.trim().length > 0 ? birthday.trim() : null;
    const clean_song_id = spotify_song_id?.trim() ? spotify_song_id.trim() : user.spotify_song_id;
    const clean_profile_url = profile_picture_url?.trim() ? profile_picture_url.trim() : user.profile_picture_url;

    try {
        await db.none(`
            INSERT INTO profiles (user_id, display_name, biography, birthday, profile_picture_url, spotify_song_id)
            VALUES ($1, $2, $3, NULLIF($4, '')::date, $5, $6)
            ON CONFLICT (user_id) DO UPDATE SET
                display_name = EXCLUDED.display_name,
                biography = EXCLUDED.biography,
                birthday = COALESCE(EXCLUDED.birthday, profiles.birthday),
                profile_picture_url = EXCLUDED.profile_picture_url,
                spotify_song_id = EXCLUDED.spotify_song_id
        `, [userId, display_name, biography, clean_birthday, clean_profile_url, clean_song_id]);

        const rawList = Array.isArray(interests)
            ? interests
            : (typeof interests === 'string' ? interests.split(',') : []);

        const selectedInterestIds = rawList
            .map(s => parseInt(s.trim(), 10))
            .filter(id => Number.isInteger(id));

        await db.none('DELETE FROM user_interests WHERE user_id = $1', [userId]);

        for (const interestId of selectedInterestIds) {
            await db.none(
                'INSERT INTO user_interests (user_id, interest_id) VALUES ($1, $2)',
                [userId, interestId]
            );
        }

        res.redirect('/profile');
    } catch (err) {
        console.error('Failed to update profile:', err);
        res.status(500).send('Error updating profile');
    }
});

router.post('/update-preferences', isAuthenticated, async (req, res) => {
    const db = req.app.locals.db;
    const userId = req.session.user.id;
    const {
        location,
        latitude,
        longitude,
        gender,
        preferred_gender,
        match_distance_miles,
        preferred_age_min,
        preferred_age_max
    } = req.body;

    const point = latitude && longitude
        ? `SRID=4326;POINT(${longitude} ${latitude})`
        : null;

    try {
        await db.none(`
            UPDATE profiles
            SET
              user_location_text = $1,
              user_location = $2,
              gender = $3,
              preferred_gender = $4,
              match_distance_miles = $5,
              preferred_age_min = $6,
              preferred_age_max = $7
            WHERE user_id = $8
        `, [
            location || null,
            point,
            gender || null,
            preferred_gender || null,
            match_distance_miles || 200,
            preferred_age_min || 18,
            preferred_age_max || 100,
            userId
        ]);

        console.log("updated preferences with location:", location);
        console.log("updated match distance:", match_distance_miles);
        console.log("updated point:", point);

        res.redirect('/profile');
    } catch (err) {
        console.error("Error updating preferences:", err);
        res.status(500).send("Failed to update preferences");
    }
});

module.exports = router;
