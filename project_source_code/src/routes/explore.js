const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const axios = require('axios');

// GET /explore - Show the main explore page
router.get('/', isAuthenticated, async (req, res) => {
  try {
    res.render('pages/explore');
  } catch (err) {
    console.error('Error loading explore page:', err);
    res.status(500).send('Something went wrong loading the Explore page.');
  }
});

// ========== RESTAURANTS ==========

// GET /explore/restaurants/loc - Renders restaurants page
router.get('/restaurants/loc', isAuthenticated, async (req, res) => {
  const { lat, lon } = req.query;
  const userId = req.session.user.id;
  const db = req.app.locals.db;

  const restaurants = await getNearbyPlaces(lat, lon, 'restaurant');
  const opinions = await db.any('SELECT place_id, opinion FROM restaurants WHERE user_id = $1', [userId]);

  const likedPlaceIds = opinions.filter(e => e.opinion === 1).map(e => e.place_id);
  const dislikedPlaceIds = opinions.filter(e => e.opinion === -1).map(e => e.place_id);

  res.render('pages/restaurants', { lat, lon, restaurants, likedPlaceIds, dislikedPlaceIds });
});

// POST /explore/restaurants/like
router.post('/restaurants/like', isAuthenticated, async (req, res) => {
  await handleLikeDislike(req, res, 'restaurants', 1);
});

// POST /explore/restaurants/dislike
router.post('/restaurants/dislike', isAuthenticated, async (req, res) => {
  await handleLikeDislike(req, res, 'restaurants', -1);
});

// ========== ACTIVITIES ==========

// GET /explore/activities/loc - Renders activities page
router.get('/activities/loc', isAuthenticated, async (req, res) => {
  const { lat, lon } = req.query;
  const userId = req.session.user.id;
  const db = req.app.locals.db;

  const activities = await getNearbyActivities(lat, lon);
  const opinions = await db.any('SELECT place_id, opinion FROM activities WHERE user_id = $1', [userId]);

  const likedPlaceIds = opinions.filter(e => e.opinion === 1).map(e => e.place_id);
  const dislikedPlaceIds = opinions.filter(e => e.opinion === -1).map(e => e.place_id);

  res.render('pages/activities', { lat, lon, activities, likedPlaceIds, dislikedPlaceIds });
});

// POST /explore/activities/like
router.post('/activities/like', isAuthenticated, async (req, res) => {
  await handleLikeDislike(req, res, 'activities', 1);
});

// POST /explore/activities/dislike
router.post('/activities/dislike', isAuthenticated, async (req, res) => {
  await handleLikeDislike(req, res, 'activities', -1);
});

// ========== HELPERS ==========

// Handles like/dislike insert/update logic
async function handleLikeDislike(req, res, table, value) {
  const { placeId } = req.body;
  const db = req.app.locals.db;
  const userId = req.session.user.id;

  try {
    const exists = await db.oneOrNone(
      `SELECT 1 FROM ${table} WHERE user_id = $1 AND place_id = $2`,
      [userId, placeId]
    );

    if (exists) {
      await db.none(
        `UPDATE ${table} SET opinion = $1 WHERE user_id = $2 AND place_id = $3`,
        [value, userId, placeId]
      );
    } else {
      await db.none(
        `INSERT INTO ${table} (user_id, place_id, opinion) VALUES ($1, $2, $3)`,
        [userId, placeId, value]
      );
    }

    res.redirect('back');
  } catch (err) {
    console.error(`Failed to update ${table} opinion:`, err);
    res.status(500).send(`Error updating ${table} opinion`);
  }
}

// Generalized Google Places query
async function getNearbyPlaces(lat, lon, type) {
  const apiKey = process.env.MAP_API_KEY;
  const radius = 4000;

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=${type}&key=${apiKey}`;

  try {
    const res = await axios.get(url);
    return res.data.results.map(place => ({
      name: place.name,
      address: place.vicinity,
      rating: place.rating,
      photo: place.photos?.[0]?.photo_reference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
        : null,
      place_id: place.place_id,
    }));
  } catch (err) {
    console.error(`Google Places API (${type}) error:`, err.response?.data || err.message);
    return [];
  }
}

// Fetches multiple types of activity-related places
async function getNearbyActivities(lat, lon) {
  const types = [
    'amusement_park', 'casino', 'movie_theater', 'bowling_alley',
    'stadium', 'tourist_attraction', 'zoo', 'museum', 'aquarium', 'art_gallery',
    'night_club', 'gym', 'spa', 'campground', 'rv_park'
  ];

  const queries = types.map(type => getNearbyPlaces(lat, lon, type));
  const results = (await Promise.all(queries)).flat();

  // Deduplicate by place_id
  const unique = new Map();
  results.forEach(p => {
    if (!unique.has(p.place_id)) unique.set(p.place_id, p);
  });

  return Array.from(unique.values());
}

module.exports = router;