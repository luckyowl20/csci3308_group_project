const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

router.get('/:type', isAuthenticated, async (req, res) => {
  const db        = req.app.locals.db;
  const viewerId  = req.session.user.id;
  const matchType = req.params.type; // 'friend' | 'romantic'

  try {
    /* ---------- 1.  Grab *everything* we need about the viewer in one go ---------- */
    const profile = await db.oneOrNone(`
      SELECT
        p.*,
        /*  ST_AsEWKT includes the SRID so we can round-trip the value safely  */
        ST_AsEWKT(p.user_location) AS user_location_ewkt
      FROM profiles p
      WHERE p.user_id = $1
    `, [viewerId]);

    if (!profile)             return res.status(400).send('No profile found');
    if (!profile.user_location)
      return res.status(400).send('Please set a location in your profile first!');

    /* ---------- 2.  Pre‑fetch lists we’ll need in JS ---------- */
    const friendIds        = (await db.any(
      'SELECT friend_id FROM friends WHERE user_id = $1', [viewerId]
    )).map(r => r.friend_id);

    const userInterestSet  = new Set(
      (await db.any(
        'SELECT interest_id FROM user_interests WHERE user_id = $1', [viewerId]
      )).map(r => r.interest_id)
    );

    /* ---------- 3.  Build gender filter snippet ---------- */
    const genderFilter = matchType === 'romantic' ? `
      AND ($2 = 'any' OR p.gender           = $2)
      AND (p.preferred_gender = 'any' OR p.preferred_gender = $3)
    ` : '';

    /* ---------- 4.  Pull candidate rows – distance is done in‑DB ---------- */
    const candidates = await db.any(`
      SELECT
        p.*,
        ST_Distance(p.user_location, ST_GeogFromText($4)) AS distance_meters
      FROM profiles p
      WHERE p.user_id <> $1
        -- exclude friends
        AND NOT EXISTS (
          SELECT 1 FROM friends f
          WHERE f.user_id = $1 AND f.friend_id = p.user_id
        )
        -- exclude already matched users
        AND NOT EXISTS (
          SELECT 1 FROM matches m
          WHERE 
            (m.user_id = $1 AND m.matched_user_id = p.user_id) OR
            (m.user_id = p.user_id AND m.matched_user_id = $1)
        )
        
        -- exclide already swiped users
        AND NOT EXISTS (
          SELECT 1 FROM swipes s
          WHERE s.swiper_id = $1 AND s.swipee_id = p.user_id
        )
        -- gender filters for romantic matches
        ${genderFilter}
        AND (
          $5 >= 995
          OR ST_Distance(p.user_location, ST_GeogFromText($4)) <= $5 * 1609.34
        )
    `, [
      viewerId,
      profile.preferred_gender,   // $2
      profile.gender,             // $3
      profile.user_location_ewkt, // $4 (already has SRID=4326;)
      profile.match_distance_miles// $5
    ]);

    /* ---------- 5.  Score & rank in JS ---------- */
    const matches = [];
    for (const c of candidates) {
      if (friendIds.includes(c.user_id)) continue;

      const candInterestSet = new Set(
        (await db.any(
          'SELECT interest_id FROM user_interests WHERE user_id = $1', [c.user_id]
        )).map(r => r.interest_id)
      );

      const intersection = new Set([...userInterestSet].filter(i => candInterestSet.has(i)));
      const union        = new Set([...userInterestSet, ...candInterestSet]);
      const jaccardScore = union.size === 0 ? 0 : intersection.size / union.size;

      /* ----- Age ----- */
      const age          = calculateAge(c.birthday);
      const ageScore     = (age >= profile.preferred_age_min && age <= profile.preferred_age_max) ? 1 : 0;

      /* ----- Distance (re‑use distance_meters we just selected) ----- */
      const miles        = c.distance_meters / 1609.34;
      const distanceScore= (profile.match_distance_miles < 1000 && miles > profile.match_distance_miles) ? 0 : 1;

      /* ----- Final weighted score ----- */
      const finalScore   = (jaccardScore * 0.6) + (ageScore * 0.2) + (distanceScore * 0.2);

      matches.push({
        candidate       : c,
        jaccardScore,
        candidate_age: age,
        ageScore,
        distanceScore,
        actualDistance  : miles,
        finalScore
      });
    }

    matches.sort((a,b) => b.finalScore - a.finalScore);

    return res.render('pages/matches', {
      layout : 'main',
      user   : req.session.user,
      matches
    });

  } catch (err) {
    console.error('Error loading matches:', err);
    return res.status(500).send('Something went wrong.');
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
