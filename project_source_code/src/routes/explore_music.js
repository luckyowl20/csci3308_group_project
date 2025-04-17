const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');


router.get('/', isAuthenticated, async (req, res) => {
  try {
    res.render('pages/music',);
  } catch (err) {
    console.error('Error loading Explore Music page:', err);
    res.status(500).send('Something went wrong loading the Explore Music page.');
  }
});

module.exports = router;