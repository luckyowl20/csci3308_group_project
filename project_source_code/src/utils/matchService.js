// src/services/matchService.js
async function getTopMatches(db, userId) {
    const userInterests = await db.any(`
      SELECT interest_id FROM user_interests WHERE user_id = $1
    `, [userId]);
  
    const interestIds = userInterests.map(row => row.interest_id);
    if (interestIds.length === 0) return [];
  
    const matches = await db.any(`
      SELECT u.id, u.username, COUNT(*) as shared_interest_count
      FROM user_interests ui
      JOIN users u ON u.id = ui.user_id
      WHERE ui.interest_id = ANY($1)
        AND u.id != $2
        AND u.id NOT IN (
          SELECT friend_id FROM friends WHERE user_id = $2
        )
      GROUP BY u.id, u.username
      ORDER BY shared_interest_count DESC, u.username
      LIMIT 20;
    `, [interestIds, userId]);
  
    return matches;
  }
  
  module.exports = { getTopMatches };
  