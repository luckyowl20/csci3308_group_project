const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
  const db = req.app.locals.db;
  const viewerId = req.session.user.id;

  try {
      // Step 1: Get current user's profile (location, age prefs, gender prefs)
      const profile = await db.oneOrNone('SELECT * FROM profiles WHERE user_id = $1', [viewerId]);
      if (!profile) return res.status(400).send("No profile found");

      // Step 2: Get IDs of user's friends — exclude these from matches
      const friends = await db.any('SELECT friend_id FROM friends WHERE user_id = $1', [viewerId]);
      const friendIds = friends.map(f => f.friend_id);

      // Step 3: Get user's interests
      const userInterests = await db.any('SELECT interest_id FROM user_interests WHERE user_id = $1', [viewerId]);
      const userInterestSet = new Set(userInterests.map(i => i.interest_id));

      // Step 4: Get potential matches
      const candidates = await db.any(`
        SELECT
          p.*,
          ST_Distance(p.user_location, $4) AS distance_meters
        FROM profiles p
        WHERE p.user_id != $1
          -- Not already friends
          AND NOT EXISTS (
            SELECT 1 FROM friends f
            WHERE f.user_id = $1 AND f.friend_id = p.user_id
          )
          -- Gender preference filters
          AND (
            $2 = 'any' OR p.gender = $2
          )
          AND (
            p.preferred_gender = 'any' OR p.preferred_gender = $3
          )
          -- Distance filter (only if < 995)
          AND (
            $5 > 995 OR ST_Distance(p.user_location, $4) <= $5 * 1609.34
          )
      `, [
        viewerId,                       // $1 - current user id
        profile.preferred_gender,       // $2 - Bob's preferred gender (current user example)
        profile.gender,                 // $3 - Bob's own gender
        profile.user_location,          // $4 - Bob's location as a PostGIS POINT
        profile.match_distance_miles    // $5 - match distance
      ]);

      const matches = [];

      for (const candidate of candidates) {
          if (friendIds.includes(candidate.user_id)) continue; // exclude friends

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

          matches.push({ // this is the format of one match item, candidate is the profile of the match
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
      console.log("Matches found:", matches);

      res.json({ matches }); // sends back the matches as a JSON response

  } catch (err) {
      console.error("Error loading matches:", err);
      res.status(500).send("Something went wrong.");
  }
});

// calculate age from birthday
function calculateAge(birthday) {
  const dob = new Date(birthday);
  const ageDifMs = Date.now() - dob.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}


module.exports = router;
