// utils/chatUtils.js
const db = require('./database')
/**
 * Get a list of friends for a given user.
 * @param {number} userId
 * @returns {Promise<Array<{ id: number, username: string, profile_picture_url: string|null }>>}
 */
async function getUserFriends(userId) {
  const friends = await db.any(
    `SELECT u.id, u.username, p.profile_picture_url
       FROM users u
       JOIN friends f   ON f.friend_id = u.id
  LEFT JOIN profiles p ON p.user_id    = u.id
      WHERE f.user_id = $1
   ORDER BY f.created_at DESC`,
    [userId]
  );
  return friends;
}

/**
 * Get a list of romantic matches for a given user.
 * @param {number} userId
 * @returns {Promise<Array<{ id: number, username: string, profile_picture_url: string|null }>>}
 */
async function getUserMatches(userId) {
  const matches = await db.any(
    `SELECT u.id, u.username, p.profile_picture_url
       FROM users u
       JOIN matches m   ON m.matched_user_id = u.id
  LEFT JOIN profiles p ON p.user_id        = u.id
      WHERE m.user_id = $1
   ORDER BY m.matched_at DESC`,
    [userId]
  );
  return matches;
}

module.exports = {
  getUserFriends,
  getUserMatches
};
