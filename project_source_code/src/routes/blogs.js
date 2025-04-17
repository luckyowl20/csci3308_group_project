const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../utils/database');
const json = require('body-parser/lib/types/json');

router.get('/', isAuthenticated, async(req,res) => {
    const user_id = req.session.user.id
    let error = false;
    let blogs, blogs_string;
    try {
        blogs = await db.any(
            `SELECT b.id, pr2.display_name as author, b.title, b.body, b.created_at, 
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
            LEFT JOIN profiles pr2
            ON pr2.user_id = b.user_id
            GROUP BY b.id, pr2.display_name
            ORDER BY b.created_at DESC;`
        );
        blogs_string = JSON.stringify(JSON.stringify(blogs));
    }
    catch (err) {
        console.log("Error gettings blogs:",err);
        error = true;
    }
    try {
        user_posts = await db.any(
            `SELECT p.id, pr.display_name as author, p.title, p.body, p.created_at, ph.url
            FROM users u
            LEFT JOIN profiles pr
            ON pr.user_id = u.id
            LEFT JOIN posts p ON
            p.user_id = u.id
            LEFT JOIN photos ph ON ph.id = p.photo_id
            WHERE u.id = $1`, [user_id]
        );
    }
    catch (err) {
        console.log("Error getting user posts:", err);
        error = true;
    }
    try {
        friend_posts = await db.any(
            `SELECT p.id, pr.display_name as author, p.title, p.body, p.created_at, ph.url
            FROM users u
            LEFT JOIN friends f
            On f.user_id = u.id
            LEFT JOIN profiles pr
            ON pr.user_id = f.friend_id
            LEFT JOIN posts p ON
            p.user_id = f.friend_id
            LEFT JOIN photos ph ON ph.id = p.photo_id
            WHERE u.id = $1`, [user_id]
        );
    }
    catch (err) {
        console.log("Error getting friend posts:",err);
        error = true;
    }
    if(!error) {
        res.render('pages/blogs', {user: req.session.user, blogs_string: blogs_string, user_posts: user_posts, friend_posts: friend_posts});
    }
    else {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/create', isAuthenticated, async(req,res) => {
    const user_id = req.session.user.id
    let error = false;
    try {
        let { title, body, selectedPosts} = req.body;
        selectedPosts = JSON.parse(selectedPosts);
        await db.none(
            `INSERT INTO blogs (user_id, title, body)
            VALUES ($1, $2, $3)`, [user_id, title, body]
        );
        const blog = await db.one(
            `SELECT id FROM blogs
            WHERE user_id = $1 AND title = $2 AND body = $3`, [user_id, title, body]
        );
        for (const post_id of selectedPosts) {
            await db.none(
                `INSERT INTO blogs_posts (blog_id, post_id)
                VALUES ($1, $2)`, [blog.id, post_id]
            );
        }
    }
    catch (err) {
        console.log("Error creating blog:",err);
        error = true;
    }
    if(!error) {
        res.redirect('/blog');
    }
    else {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;