// learnmore.js or learnMore.js
const express = require('express');
const router = express.Router();

// GET /learnmore - Public access
router.get('/', async (req, res) => {
  try {
    res.render('pages/learnmore', { layout: 'landing', title: 'About | LuckyMoment' });
  } catch (err) {
    console.error('Error loading Learn More page:', err);
    res.status(500).send('Something went wrong loading the Learn More page.');
  }
});

module.exports = router;