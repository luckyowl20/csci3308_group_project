const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

async function calculateMatches(db, userId, matchType) {
  console.log(`[MatchDebug] Starting match calculation for user ${userId}, type: ${matchType}`);

  // Step 1: Get current user's profile
  const profile = await db.oneOrNone('SELECT * FROM profiles WHERE user_id = $1', [userId]);
  if (!profile) throw new Error("No profile found");
  console.log(`[MatchDebug] User profile:`, profile);

  // Step 2: Get user's friends
  const friends = await db.any('SELECT friend_id FROM friends WHERE user_id = $1', [userId]);
  const friendIds = friends.map(f => f.friend_id);
  console.log(`[MatchDebug] Friend IDs:`, friendIds);

  // Step 3: Get user's interests
  const userInterests = await db.any('SELECT interest_id FROM user_interests WHERE user_id = $1', [userId]);
  const userInterestSet = new Set(userInterests.map(i => i.interest_id));
  console.log(`[MatchDebug] User interest IDs:`, [...userInterestSet]);

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

    -- Exclude friends
    AND NOT EXISTS (
      SELECT 1 FROM friends f
      WHERE f.user_id = $1 AND f.friend_id = p.user_id
    )

    -- Exclude already matched users
    AND NOT EXISTS (
      SELECT 1 FROM matches m
      WHERE
        (m.user_id = $1 AND m.matched_user_id = p.user_id) OR
        (m.user_id = p.user_id AND m.matched_user_id = $1)
    )

    -- Exclude already swiped users
    AND NOT EXISTS (
      SELECT 1 FROM swipes s
      WHERE s.swiper_id = $1 AND s.swipee_id = p.user_id
    )

    -- Optional: Apply gender preferences if type is romantic
    ${genderFilter}

    -- Optional: Apply match distance filter
    AND (
      $5 > 995 OR ST_Distance(p.user_location::geography, $4::geography) <= $5 * 1609.34
    )
`, [
  userId,                       // $1 - current user id
  profile.preferred_gender,       // $2 - Bob's preferred gender (current user example)
  profile.gender,                 // $3 - Bob's own gender
  profile.user_location,          // $4 - Bob's location as a PostGIS POINT
  profile.match_distance_miles    // $5 - match distance
]);


  console.log(`[MatchDebug] Found ${candidates.length} raw candidates`);

  const matches = [];

  for (const candidate of candidates) {
    console.log(`[MatchDebug] Evaluating candidate ${candidate.user_id}`);

    if (friendIds.includes(candidate.user_id)) {
      console.log(`[MatchDebug] Skipping ${candidate.user_id} (already a friend)`);
      continue; // exclude friends
    }

    // Get candidate interests
    const candidateInterests = await db.any('SELECT interest_id FROM user_interests WHERE user_id = $1', [candidate.user_id]);
    const candidateInterestSet = new Set(candidateInterests.map(i => i.interest_id));

    // Jaccard Score (union of interests between user and candidate / intersection of interests, A u B / A n B) 
    const intersection = new Set([...userInterestSet].filter(x => candidateInterestSet.has(x)));
    const union = new Set([...userInterestSet, ...candidateInterestSet]);
    const jaccardScore = union.size === 0 ? 0 : intersection.size / union.size;

    // Age Calculation
    const age = calculateAge(candidate.birthday);
    const ageScore = (age >= profile.preferred_age_min && age <= profile.preferred_age_max) ? 1 : 0;

    // Distance Score (only calculated if user has a location and distance preference)
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

    // Final score (adjust weights as needed)
    const finalScore = (jaccardScore * 0.6) + (ageScore * 0.2) + (distanceScore * 0.2);

    console.log(`[MatchDebug] Candidate ${candidate.user_id} - Age: ${age}, Jaccard: ${jaccardScore.toFixed(2)}, Distance: ${actualDistance?.toFixed(2)}, Final: ${finalScore.toFixed(2)}`);

    matches.push({ // this is the format of one match item, candidate is the profile of the match
      candidate,
      jaccardScore,
      ageScore,
      distanceScore,
      actualDistance,
      finalScore
    });
  }

  console.log(`[MatchDebug] Total matches after scoring: ${matches.length}`);

  // Sort by final score descending
  matches.sort((a, b) => b.finalScore - a.finalScore);
  console.log("Matches found:", matches);
  return { matches };
}

// calculate age from birthday
function calculateAge(birthday) {
  const dob = new Date(birthday);
  const ageDifMs = Date.now() - dob.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
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