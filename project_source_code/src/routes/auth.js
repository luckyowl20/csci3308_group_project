// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// GET /auth/login - Render login page
router.get('/login', (req, res) => {
    const message = req.session.message;
    const error = req.session.error;
    req.session.message = null;
    req.session.error = null;
  
    res.render('pages/login', {
      layout: 'landing',
      title: 'Login | LuckyMoment',
      message,
      error
    });
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
            return res.render('pages/login', {
                layout: 'landing',
                title: 'Login | LuckyMoment',
                message: 'Incorrect username or password.',
                error: true
              });
                    }

        req.session.user = user;
        req.session.save(() => {
            console.log("Successfully logged in user:", username)
            res.redirect('/home');
        });
    } catch (error) {
        console.error('Login error:', error.message);
        return res.render('pages/login', {
            layout: 'landing',
            title: 'Login | LuckyMoment',
            message: 'An error occured, please try again.',
            error: true
          });    }
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
    res.render('pages/register', { layout: 'landing', title: 'About | LuckyMoment' });
});

// POST /auth/register - Process registration
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("Attempting to register user:", username);

        const db = req.app.locals.db;
        // queries the database for a user that may or may not exist based on the username
        const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);

        if (user) {
            console.log("User already exists:",username);
            return res.render('pages/register', {
                layout: 'landing',
                title: 'Register | LuckyMoment',
                message: 'Username already exists. Please choose another.',
                error: true
              });;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [username, hashedPassword]);
        console.log("Successfully registered user:", username);
        
        res.status(200);
        return res.render('pages/login', { message: 'Registration successful! You can now log in.', error: false });
        
        
        
    } catch (error) {
        console.error('Registration error:', error.message);
        return res.render('pages/register', {
            layout: 'landing',
            title: 'Register | LuckyMoment',
            message: 'Registration failed. Try again later.',
            error: true
          });
    }
});

module.exports = router;
