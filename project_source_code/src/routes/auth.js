// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// GET /auth/login - Render login page
router.get('/login', (req, res) => {
    const message = req.session.message;
    req.session.message = null;
    res.render('pages/login', { message });
});

// POST /auth/login - Process login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("User attempting login with:", username, password);

        const db = req.app.locals.db;
        const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);

        if (!user) {
            console.log("User:", username, "does not exist");
            return res.redirect('/auth/register');
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.render('pages/login', { message: 'Incorrect username or password.', error: true });
        }

        req.session.user = user;
        req.session.save(() => {
            console.log("Successfully logged in user:", username)
            res.redirect('/');
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.render('pages/login', { message: 'An error occurred. Please try again.', error: true });
    }
});

// GET /auth/logout - Logout the user
router.get('/logout', (req, res) => {
    console.log("Logging out user:", req.session.user.username);
    req.session.destroy(err => {
    if (err) {
        console.error('Logout error:', err);
        return res.status(500).send('Error logging out.');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
    });
});

// GET /auth/register - Render registration page
router.get('/register', (req, res) => {
    res.render('pages/register');
});

// POST /auth/register - Process registration
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("Attempting to register user:", username);

        const db = req.app.locals.db;
        const userExists = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);

        if (userExists) {
            console.log("User already exists:",username);
            return res.render('pages/register', { message: 'Username already exists. Please choose another.', error: true });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [username, hashedPassword]);
        req.session.message = { text: 'Registration successful! You can now log in.' };
        console.log("Successfully registered user:", username);
        res.redirect('/auth/login');
    } catch (error) {
        console.error('Registration error:', error.message);
        res.render('pages/register', { message: 'Registration failed. Please try again.', error: true });
    }
});

module.exports = router;
