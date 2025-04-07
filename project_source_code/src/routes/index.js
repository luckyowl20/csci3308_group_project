// routes/index.js
const express = require('express');
const router = express.Router();

// Welcome route
router.get('/welcome', (req, res) => {
    res.json({ status: 'success', message: 'Welcome!' });
});

// Home page (you can change this to your landing page)
router.get('/', (req, res) => {
    res.render('pages/about');
});

// About page
router.get('/about', (req, res) => {
    res.render('pages/about');
});

// Explore page
router.get('/explore', (req, res) => {
    res.render('pages/explore');
});

// Profile page
router.get('/profile', (req, res) => {
    res.render('pages/personal_profile');
});

module.exports = router;
