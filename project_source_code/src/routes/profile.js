const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');


router.get('/', isAuthenticated, async (req, res) => {

    // console.log("clicked on profile");
    const db = req.app.locals.db;
    const userId = req.session.user.id;

    try {
        // loading the users profile information
        const profile = await db.oneOrNone('SELECT * FROM profiles WHERE user_id = $1', [userId]);

        // loading the users selected interests
        const selectedInterests = await db.any(`
            SELECT i.id, i.name FROM interests i
            JOIN user_interests ui ON i.id = ui.interest_id
            WHERE ui.user_id = $1
          `, [userId]);

        // console.log("found interests:", selectedInterests);

        const recentPhotos = await db.any(
            `SELECT photos.url, photos.description AS caption, posts.created_at
             FROM posts
             JOIN photos ON posts.photo_id = photos.id
             WHERE posts.user_id = $1
               AND posts.created_at >= NOW() - INTERVAL '7 days'
             ORDER BY posts.created_at DESC`,
            [userId]
        );

        // console.log("found profile:", profile);

        // loading the users friends
        const friends = await db.any(`
            SELECT
              u.id,
              u.username,
              p.profile_picture_url
            FROM friends f
            JOIN users u
              ON u.id = f.friend_id
            JOIN profiles p
              ON p.user_id = u.id
            WHERE f.user_id = $1
          `, [userId]);

        // 2) Matches
        const matches = await db.any(`
            SELECT
              u.id,
              u.username,
              p.profile_picture_url
            FROM matches m
            JOIN users u
              ON u.id = m.matched_user_id
            JOIN profiles p
              ON p.user_id = u.id
            WHERE m.user_id = $1
          `, [userId]);

        // console.log("found friends:", friends);

        // rendering the profile
        res.render('pages/profile', {
            layout: 'main',
            profile,
            recentPhotos,
            friends,
            matches,
            user: req.session.user, // if you use it in nav bar or elsewhere
            isOwnProfile: true,
            selectedInterestsDetails: selectedInterests,
            public_friends: true // no need to keep friends private for viewing own profile
        });

    } catch (err) {
        console.error('Error loading profile:', err);
        res.status(500).send('Something went wrong loading the profile.');
    }
});

// search for interests in the edit modal
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

// get a friends profile
router.get('/:id', isAuthenticated, async (req, res) => {
    const db = req.app.locals.db;
    const viewerId = req.session.user.id;
    const targetId = parseInt(req.params.id);

    try {
        const isFriend = await db.oneOrNone(`
            SELECT 1 FROM friends
            WHERE user_id = $1 AND friend_id = $2
        `, [viewerId, targetId]);
        
        const isMatch = await db.oneOrNone(`
            SELECT 1
              FROM matches
             WHERE (user_id         = $1 AND matched_user_id = $2)
                OR (user_id         = $2 AND matched_user_id = $1)
             LIMIT 1
          `, [viewerId, targetId]);
        console.log("users matching:", viewerId, targetId, isMatch);
        console.log("users matching:", viewerId, targetId, isFriend);

        if (!isFriend && !isMatch) {
            return res.status(403).send("You can only view your own friends'/matches' profiles.");
        }

        const profile = await db.oneOrNone(`
            SELECT
            p.id,
            p.user_id,
            p.display_name,
            p.biography,
            p.birthday,
            p.profile_picture_url,
            u.username         -- pull in the username
        FROM profiles p
        JOIN users u
            ON u.id = p.user_id
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

        const friends = await db.any(`
            SELECT
              u.id,
              u.username,
              p.profile_picture_url
            FROM friends f
            JOIN users u
              ON u.id = f.friend_id
            JOIN profiles p
              ON p.user_id = u.id
            WHERE f.user_id = $1
          `, [targetId]);

        const user_settings = await db.oneOrNone(`
            SELECT *
            FROM user_settings us
            WHERE us.user_id = $1`, [targetId]
        );
        if (user_settings)
            public_friends = user_settings.public_friends;
        else public_friends = true; //reflects default setting

        // the profile of the friend we are viewing

        res.render('pages/profile', {
            layout: 'main',
            profile,
            selectedInterestsDetails: selectedInterests,
            recentPhotos,
            friends,
            matches : [],
            user: req.session.user,
            isOwnProfile: false,
            public_friends: public_friends
        });

    } catch (err) {
        console.error('Error loading friend profile:', err);
        res.status(500).send('Something went wrong loading the profile.');
    }
});

// for updating the profile after the edit profile modal is submitted
router.post('/update', isAuthenticated, async (req, res) => {
    const db = req.app.locals.db;
    const user = req.session.user; //getting user from session
    const userId = user.id;
    const { display_name, biography, interests, birthday, profile_picture_url, spotify_song_id } = req.body;
    // console.log("update called with song:", spotify_song_id)

    // cleaning some variables to prevent insertion errors
    const clean_birthday = birthday && birthday.trim().length > 0
        ? birthday.trim()
        : null;

    const clean_song_id = spotify_song_id?.trim()
        ? spotify_song_id.trim()
        : user.spotify_song_id;

    // THIS WILL NEED TO BE REPLCED WITH AN IMAGE DATABASE QUERY
    const clean_profile_url = profile_picture_url?.trim()
        ? profile_picture_url.trim()
        : user.profile_picture_url;

    console.log("clean profile url:", clean_profile_url);

    // Upsert pattern — insert or update if exists
    // this is done by ON CONFLICT and EXCLUDED means we want to set the attribute to the value we attempted to insert 
    // ON CONFLICT is used to prevent duplicates
    // EXCLUDED.column refers to the new column from the attempted insert (in values)
    try {
        // Upsert profile info (excluding interests)
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

        // update interests in user_interests table
        // normalize to an array of raw strings (["1","2","3"] or [""] if empty)
        const rawList = Array.isArray(interests)
            ? interests
            : (typeof interests === 'string' ? interests.split(',') : []);

        // map → int → filter out NaN
        const selectedInterestIds = rawList
            .map(s => parseInt(s.trim(), 10))
            .filter(id => Number.isInteger(id));

        // clear out old choices
        await db.none('DELETE FROM user_interests WHERE user_id = $1', [userId]);

        // only insert real IDs
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

// for updating the users preferences in the database after the edit preferences modal is submitted
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


    // Construct POINT string only if both latitude and longitude are valid
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
            preferred_age_min || 18,        // default values 200, 18, 100 in database too
            preferred_age_max || 100,
            userId
        ]);

        console.log("updated preferences with location:", location);
        // console.log("updated preferences with latitude:", latitude);
        // console.log("updated preferences with longitude:", longitude);
        // console.log("updated gender, preferred gender", gender, preferred_gender);
        console.log("updated match distance:", match_distance_miles);
        console.log("updated point:", point);

        res.redirect('/profile');
    } catch (err) {
        console.error("Error updating preferences:", err);
        res.status(500).send("Failed to update preferences");
    }
});


module.exports = router;
