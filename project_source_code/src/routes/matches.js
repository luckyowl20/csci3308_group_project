const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { calculateMatches } = require('../utils/matcher');


/* 
 * GET /matches/:type - Returns potential matches based on algorithm
 * Uses the calculateMatches function internally
 */
router.get('/:type', isAuthenticated, async (req, res) => {
  try {
    const result = await calculateMatches(
      req.app.locals.db,
      req.session.user.id,
      req.params.type
    );
    res.json(result);
  } catch (err) {
    console.error("Error loading matches:", err);
    res.status(500).send(err.message || "Something went wrong.");
  }
});

// Export the router normally for Express
module.exports = router;
