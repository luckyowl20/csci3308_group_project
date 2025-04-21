const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// calculate age from birthday
function calculateAge(birthday) {
  const dob = new Date(birthday);
  const ageDifMs = Date.now() - dob.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

/* 
 * Core matching algorithm - same logic as original route handler
 * Now can be used by both the route and swipe.js
 */
async function calculateMatches(db, userId, matchType) {
  // Step 1: Get current user's profile (location, age prefs, gender prefs)
  const profile = await db.oneOrNone('SELECT * FROM profiles WHERE user_id = $1', [userId]);
  if (!profile) throw new Error("No profile found");

  // Step 2: Get IDs of user's friends — exclude these from matches
  const friends = await db.any('SELECT friend_id FROM friends WHERE user_id = $1', [userId]);
  const friendIds = friends.map(f => f.friend_id);

  // Step 3: Get user's interests
  const userInterests = await db.any('SELECT interest_id FROM user_interests WHERE user_id = $1', [userId]);
  const userInterestSet = new Set(userInterests.map(i => i.interest_id));

  // Step 4: Get potential matches
  const genderFilter = matchType === 'romantic' ? `
    AND (
      $2 = 'any' OR p.gender = $2
    )
    AND (
      p.preferred_gender = 'any' OR p.preferred_gender = $3
    )
  ` : '';

  const candidates = await db.any(`
    SELECT
      p.*,
      ST_Distance(p.user_location, $4) AS distance_meters
    FROM profiles p
    WHERE p.user_id != $1
      AND NOT EXISTS (
        SELECT 1 FROM friends f
        WHERE f.user_id = $1 AND f.friend_id = p.user_id
      )
      ${genderFilter}
      AND (
        $5 > 995 OR ST_Distance(p.user_location::geography, $4::geography) <= $5 * 1609.34
      )
  `, [
    userId,
    profile.preferred_gender,
    profile.gender,
    profile.user_location,
    profile.match_distance_miles
  ]);

  const matches = [];

  for (const candidate of candidates) {
    if (friendIds.includes(candidate.user_id)) continue;

    // Get candidate interests
    const candidateInterests = await db.any('SELECT interest_id FROM user_interests WHERE user_id = $1', [candidate.user_id]);
    const candidateInterestSet = new Set(candidateInterests.map(i => i.interest_id));

    // Jaccard Score calculation
    const intersection = new Set([...userInterestSet].filter(x => candidateInterestSet.has(x)));
    const union = new Set([...userInterestSet, ...candidateInterestSet]);
    const jaccardScore = union.size === 0 ? 0 : intersection.size / union.size;

    // Age Calculation
    const age = calculateAge(candidate.birthday);
    const ageScore = (age >= profile.preferred_age_min && age <= profile.preferred_age_max) ? 1 : 0;

    // Distance Score
    let distanceScore = 1;
    let actualDistance = null;
    if (profile.user_location && candidate.user_location && profile.match_distance_miles < 1000) {
      const result = await db.one(`
        SELECT ST_Distance(
          $1::geography, $2::geography
        ) / 1609.34 AS miles
      `, [profile.user_location, candidate.user_location]);
      actualDistance = result.miles;
      if (actualDistance > profile.match_distance_miles) distanceScore = 0;
    }

    // Final weighted score
    const finalScore = (jaccardScore * 0.6) + (ageScore * 0.2) + (distanceScore * 0.2);

    matches.push({
      candidate,
      jaccardScore,
      ageScore,
      distanceScore,
      actualDistance,
      finalScore
    });
  }

  // Sort by final score descending
  matches.sort((a, b) => b.finalScore - a.finalScore);
  return { matches };
}

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
    res.status(500).send("Something went wrong.");
  }
});

// Export the router normally for Express
module.exports = router;

// Export the function separately for swipe.js
module.exports.calculateMatches = calculateMatches;