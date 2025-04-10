// routes/index.js
const express = require('express');
const router = express.Router();

// Welcome route
router.get('/welcome', (req, res) => {
    res.json({ status: 'success', message: 'Welcome!' });
});

// About/enter page
router.get('/', (req, res) => {
    res.render('pages/about', { layout: 'landing', title: 'About | LuckyMoment' });
});

// About page
router.get('/about', (req, res) => {
    res.render('pages/about', { layout: 'landing', title: 'About | LuckyMoment' });
});


// Profile page handled in the profile.js routes

module.exports = router;
