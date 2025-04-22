// src/utils/matching.js

// calculate age from birthday
function calculateAge(birthday) {
    const dob = new Date(birthday);
    const ageDifMs = Date.now() - dob.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }
  
  async function getMatchesForUser(db, viewerId, matchType) {
    // 1. Load viewer profile
    const profile = await db.oneOrNone(`
      SELECT p.*, ST_AsEWKT(p.user_location) AS user_location_ewkt
      FROM profiles p
      WHERE p.user_id = $1
    `, [viewerId]);
  
    if (!profile) throw new Error('No profile found');
    if (!profile.user_location) throw new Error('Location not set');
  
    // 2. Pre‑fetch friend IDs and interests
    const friendIds = (await db.any(
      'SELECT friend_id FROM friends WHERE user_id = $1', [viewerId]
    )).map(r => r.friend_id);
  
    const userInterestSet = new Set(
      (await db.any(
        'SELECT interest_id FROM user_interests WHERE user_id = $1', [viewerId]
      )).map(r => r.interest_id)
    );
  
    // 3. Gender filter snippet
    const genderFilter = matchType === 'romantic' ? `
      AND ($2 = 'any' OR p.gender = $2)
      AND (p.preferred_gender = 'any' OR p.preferred_gender = $3)
    ` : '';
  
    // 4. Fetch raw candidates with distance
    const candidates = await db.any(`
      SELECT p.*, ST_Distance(p.user_location, ST_GeogFromText($4)) AS distance_meters
      FROM profiles p
      WHERE p.user_id <> $1
        AND NOT EXISTS (
          SELECT 1 FROM friends f WHERE f.user_id = $1 AND f.friend_id = p.user_id
        )
        AND NOT EXISTS (
          SELECT 1 FROM matches m
          WHERE (m.user_id = $1 AND m.matched_user_id = p.user_id)
             OR (m.user_id = p.user_id AND m.matched_user_id = $1)
        )
        AND NOT EXISTS (
          SELECT 1 FROM swipes s WHERE s.swiper_id = $1 AND s.swipee_id = p.user_id
        )
        ${genderFilter}
        AND (
          $5 >= 995
          OR ST_Distance(p.user_location, ST_GeogFromText($4)) <= $5 * 1609.34
        )
    `, [
      viewerId,
      profile.preferred_gender,
      profile.gender,
      profile.user_location_ewkt,
      profile.match_distance_miles
    ]);
  
    // 5. Score & rank
    const matches = [];
    for (const c of candidates) {
      if (friendIds.includes(c.user_id)) continue;
  
      const candInterestSet = new Set(
        (await db.any(
          'SELECT interest_id FROM user_interests WHERE user_id = $1', [c.user_id]
        )).map(r => r.interest_id)
      );
      const intersection = new Set([...userInterestSet].filter(i => candInterestSet.has(i)));
      const union = new Set([...userInterestSet, ...candInterestSet]);
      const jaccardScore = union.size ? intersection.size / union.size : 0;
  
      const age = calculateAge(c.birthday);
      const ageScore = (age >= profile.preferred_age_min && age <= profile.preferred_age_max) ? 1 : 0;
  
      const miles = c.distance_meters / 1609.34;
      const distanceScore = (profile.match_distance_miles < 1000 && miles > profile.match_distance_miles)
        ? 0 : 1;
  
      matches.push({
        candidate: c,
        jaccardScore,
        candidate_age: age,
        ageScore,
        distanceScore,
        actualDistance: miles,
        finalScore: (jaccardScore * 0.6) + (ageScore * 0.2) + (distanceScore * 0.2)
      });
    }
  
    // sort highest first
    return matches.sort((a, b) => b.finalScore - a.finalScore);
  }
  
  module.exports = { getMatchesForUser };
  