// routes/photos.js
const express = require('express');
const router = express.Router();

router.get('/week_photos', async (req, res) => {
    const db = req.app.locals.db;
    const user_id = req.session.user_id; // Adjust if your session stores the full user object (e.g., req.session.user.id)

    if (!user_id) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const photos = await db.any(
        `SELECT photos.* FROM photos
        JOIN posts ON photos.id = posts.photo_id
        WHERE posts.user_id = $1
            AND photos.uploaded_at >= NOW() - INTERVAL '7 days'
        ORDER BY photos.uploaded_at DESC`,
        [user_id]
    );
    res.json(photos);
    } catch (err) {
        console.error('Error querying photos:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
