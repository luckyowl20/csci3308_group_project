// utils/matchAdapter.js
const { calculateMatches } = require('../routes/matches');

module.exports = {
  async getMatches(db, userId, matchType) {
    try {
      return await calculateMatches(db, userId, matchType);
    } catch (error) {
      console.error('Match calculation failed:', error);
      return { matches: [] }; // Return empty array on failure
    }
  }
};