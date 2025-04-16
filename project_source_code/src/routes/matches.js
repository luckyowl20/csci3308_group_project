// src/routes/matches.js
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const matchService = require('../services/matchService');

router.get('/', isAuthenticated, async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.session.user.id;

  try {
    const matches = await matchService.getTopMatches(db, userId);
    res.render('pages/matches', {
      layout: 'main',
      matches,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Failed to fetch matches:", err);
    res.status(500).send("Could not load matches.");
  }
});

module.exports = router;
