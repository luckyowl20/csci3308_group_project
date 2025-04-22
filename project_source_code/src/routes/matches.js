const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { getMatchesForUser } = require('../utils/matching');

router.get('/:type', isAuthenticated, async (req, res) => {
  const db = req.app.locals.db;
  const viewerId = req.session.user.id;
  const matchType = req.params.type; // 'friend' | 'romantic'

  try {
    const matches = await getMatchesForUser(db, viewerId, matchType);
    return res.json({ matches });
  } catch (err) {
    console.error('Error loading matches:', err);
    return res.status(500).send('Something went wrong.');
  }
});

module.exports = router;