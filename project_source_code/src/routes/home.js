const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// GET /explore - Show the main explore page
router.get('/', isAuthenticated, async (req, res) => {
  try {
    res.render('pages/home');
  } catch (err) {
    console.error('Error loading home page:', err);
    res.status(500).send('Something went wrong loading the home page.');
  }
});

module.exports = router;