const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

async function calculateMatches(db, userId, matchType) {
  console.log(`[MatchDebug] Starting match calculation for user ${userId}, type: ${matchType}`);

  // Step 1: Get current user's profile with user_location_ewkt
  const profile = await db.oneOrNone(`
    SELECT
      p.*,
      ST_AsEWKT(p.user_location) AS user_location_ewkt
    FROM profiles p
    WHERE p.user_id = $1
  `, [userId]);
  
  if (!profile) throw new Error("No profile found");
  console.log(`[MatchDebug] User profile:`, profile);
  
  if (!profile.user_location) {
    throw new Error("Please set a location in your profile first!");
  }

  // Step 2: Get user's friends
  const friends = await db.any('SELECT friend_id FROM friends WHERE user_id = $1', [userId]);
  const friendIds = friends.map(f => f.friend_id);
  console.log(`[MatchDebug] Friend IDs:`, friendIds);

  // Step 3: Get user's interests
  const userInterests = await db.any('SELECT interest_id FROM user_interests WHERE user_id = $1', [userId]);
  const userInterestSet = new Set(userInterests.map(i => i.interest_id));
  console.log(`[MatchDebug] User interest IDs:`, [...userInterestSet]);

  // Step 4: Build gender filter snippet
  const genderFilter = matchType === 'romantic' ? `
    AND (
      $2 = 'any' OR p.gender = $2
    )
    AND (
      p.preferred_gender = 'any' OR p.preferred_gender = $3
    )
  ` : '';

  // Step 5: Get potential matches with distance calculated in-DB
  const candidates = await db.any(`
    SELECT
      p.*,
      ST_Distance(p.user_location, ST_GeogFromText($4)) AS distance_meters
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

      -- Apply gender preferences if type is romantic
      ${genderFilter}

      -- Apply match distance filter
      AND (
        $5 >= 995 OR ST_Distance(p.user_location, ST_GeogFromText($4)) <= $5 * 1609.34
      )
  `, [
    userId,                       // $1 - current user id
    profile.preferred_gender,     // $2 - user's preferred gender
    profile.gender,               // $3 - user's own gender
    profile.user_location_ewkt,   // $4 - user's location as EWKT
    profile.match_distance_miles  // $5 - match distance
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

    // Jaccard Score (intersection of interests between user and candidate / union of interests)
    const intersection = new Set([...userInterestSet].filter(x => candidateInterestSet.has(x)));
    const union = new Set([...userInterestSet, ...candidateInterestSet]);
    const jaccardScore = union.size === 0 ? 0 : intersection.size / union.size;

    // Age Calculation
    const age = calculateAge(candidate.birthday);
    const ageScore = (age >= profile.preferred_age_min && age <= profile.preferred_age_max) ? 1 : 0;

    // Distance Score (using pre-calculated distance from DB query)
    const miles = candidate.distance_meters / 1609.34;
    const distanceScore = (profile.match_distance_miles < 1000 && miles > profile.match_distance_miles) ? 0 : 1;

    // Final score (adjust weights as needed)
    const finalScore = (jaccardScore * 0.6) + (ageScore * 0.2) + (distanceScore * 0.2);

    console.log(`[MatchDebug] Candidate ${candidate.user_id} - Age: ${age}, Jaccard: ${jaccardScore.toFixed(2)}, Distance: ${miles?.toFixed(2)}, Final: ${finalScore.toFixed(2)}`);

    matches.push({
      candidate,
      jaccardScore,
      candidate_age: age,
      ageScore,
      distanceScore,
      actualDistance: miles,
      finalScore
    });
  }

  console.log(`[MatchDebug] Total matches after scoring: ${matches.length}`);

  // Sort by final score descending
  matches.sort((a, b) => b.finalScore - a.finalScore);
  console.log("[MatchDebug] Matches found:", matches);
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
    res.status(500).send(err.message || "Something went wrong.");
  }
});

// Export the router normally for Express
module.exports = router;

// Export the function separately for swipe.js
module.exports.calculateMatches = calculateMatches;