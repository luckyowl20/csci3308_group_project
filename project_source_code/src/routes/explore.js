const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// GET /explore - Show the main explore page
router.get('/', isAuthenticated, async (req, res) => {
  try {
    res.render('pages/explore');
  } catch (err) {
    console.error('Error loading explore page:', err);
    res.status(500).send('Something went wrong loading the Explore page.');
  }
});

// GET /restaurants/loc - Renders restaurants page to show nearby restaurants based on user location
router.get('/restaurants/loc', isAuthenticated, async (req, res) => {
  const { lat, lon } = req.query;
  
  const userId = req.session.user.id;
  const db = req.app.locals.db;

  // 1. Get restaurant data from Google Places API
  const restaurants = await getNearbyRestaurants(lat, lon);

  // console.log(restaurants);

  // // 2. Query user's opinions
  const opinions = await db.any(
    'SELECT place_id, opinion FROM restaurants WHERE user_id = $1',
    [userId]
  );

  // console.log(opinions)

  // Separate liked and disliked place_ids
  const likedPlaceIds = opinions
    .filter(entry => entry.opinion === 1)
    .map(entry => entry.place_id);

  const dislikedPlaceIds = opinions
    .filter(entry => entry.opinion === -1)
    .map(entry => entry.place_id);

  res.render('pages/restaurants', {
    lat,
    lon,
    restaurants,
    likedPlaceIds,
    dislikedPlaceIds
  });
});

router.post('/restaurants/like', isAuthenticated, async (req, res) => {
  const { placeId } = req.body;
  console.log(`👍 Liked: ${placeId}`);
  
  const db = req.app.locals.db;  // Assuming db is already configured with pg-promise
  const userId = req.session.user.id;  // Get user ID from session

  try {
    // Check if the user has already given an opinion (like or dislike) on this restaurant
    const existingOpinion = await db.oneOrNone(
      `SELECT opinion FROM restaurants WHERE user_id = $1 AND place_id = $2`,
      [userId, placeId]
    );

    if (existingOpinion) {
      // If the user already has an opinion, update it (set like to 1)
      await db.none(
        `UPDATE restaurants SET opinion = $1 WHERE user_id = $2 AND place_id = $3`,
        [1, userId, placeId]
      );
      console.log(`Updated opinion: Liked ${placeId}`);
    } else {
      // If the user hasn't given an opinion, insert a new record with "like" (opinion = 1)
      await db.none(
        `INSERT INTO restaurants (user_id, place_id, opinion) VALUES ($1, $2, $3)`,
        [userId, placeId, 1]
      );
      console.log(`New like added: ${placeId}`);
    }

    
  } catch (err) {
    console.error('Failed to update like:', err);
    res.status(500).send('Error updating restaurant like');
  }
});

router.post('/restaurants/dislike', isAuthenticated, async (req, res) => {
  const { placeId } = req.body;
  console.log(`👎 Disliked: ${placeId}`);
  
  const db = req.app.locals.db;  // Assuming db is configured with pg-promise
  const userId = req.session.user.id;  // Get user ID from session

  try {
    // Check if the user has already given an opinion (like or dislike) on this restaurant
    const existingOpinion = await db.oneOrNone(
      `SELECT opinion FROM restaurants WHERE user_id = $1 AND place_id = $2`,
      [userId, placeId]
    );

    if (existingOpinion) {
      // If the user already has an opinion, update it (set dislike to -1)
      await db.none(
        `UPDATE restaurants SET opinion = $1 WHERE user_id = $2 AND place_id = $3`,
        [-1, userId, placeId]
      );
      console.log(`Updated opinion: Disliked ${placeId}`);
    } else {
      // If the user hasn't given an opinion, insert a new record with "dislike" (opinion = -1)
      await db.none(
        `INSERT INTO restaurants (user_id, place_id, opinion) VALUES ($1, $2, $3)`,
        [userId, placeId, -1]
      );
      console.log(`New dislike added: ${placeId}`);
    }
    
  } catch (err) {
    console.error('Failed to update dislike:', err);
    res.status(500).send('Error updating restaurant dislike');
  }
});

const axios = require('axios');

// Query api for restaurant based on lat and lon
async function getNearbyRestaurants(lat, lon) {
  const apiKey = process.env.MAP_API_KEY;
  const radius = 2000; // meters

  // Api request structure
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=restaurant&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    return response.data.results.map(place => ({
      name: place.name,
      address: place.vicinity,
      rating: place.rating,
      photo: place.photos?.[0]?.photo_reference
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
      : null,
      place_id: place.place_id,
    }));
  } catch (error) {
    console.error('Google Places API error:', error.response?.data || error.message);
    return [];
  }
} 


module.exports = router;