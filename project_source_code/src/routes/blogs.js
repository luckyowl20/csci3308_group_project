const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../utils/database');

router.get('/', async(req,res) => {
    user = req.app.locals.user;
    let error = false;
    let blogs, blogs_string;
    try {
        blogs = await db.any(
            `SELECT b.id, b.title, b.body, b.created_at, 
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'id', p.id,
                    'title', p.title,
                    'body', p.body,
                    'created_at', p.created_at,
                    'url', ph.url,
                    'author', pr.display_name
                )
            ) AS blogposts
            FROM blogs b
            LEFT JOIN blogs_posts bp
            ON bp.blog_id = b.id
            LEFT JOIN posts p
            ON p.id = bp.post_id
            LEFT JOIN photos ph
            ON ph.id = p.photo_id
            LEFT JOIN profiles pr
            ON pr.user_id = p.user_id
            GROUP BY b.id;`
        );
        blogs_string = JSON.stringify(JSON.stringify(blogs));
    }
    catch (err) {
        console.log("Error gettings blogs:",err);
        error = true;
    }
    if(!error) {
        console.log(blogs_string);
        res.render('pages/blogs', {user: user, blogs_string: blogs_string});
    }
    else {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;