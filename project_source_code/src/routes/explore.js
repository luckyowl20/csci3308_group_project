const express = require('express');
const router = express.Router();
const axios = require('axios');
const { isAuthenticated } = require('../middleware/auth');

// GET /explore
router.get('/', isAuthenticated, async (req, res) => {
  try {
    res.render('pages/explore2');
  } catch (err) {
    console.error('Error loading explore page:', err);
    res.status(500).send('Something went wrong loading the Explore page.');
  }
});

// -----------------------------
// RESTAURANTS ROUTES
// -----------------------------
router.get('/restaurants', isAuthenticated, async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.session.user.id;

  const userLocation = await db.oneOrNone(
    `SELECT ST_Y(user_location::geometry) AS latitude, ST_X(user_location::geometry) AS longitude 
     FROM profiles WHERE id = $1;`,
    [userId]
  );

  if (!userLocation) {
    return res.render('pages/explore', {
      message: 'Location not provided, please update your profile.',
      error: true
    });
  }

  const lat = userLocation.latitude;
  const lon = userLocation.longitude;
  const restaurants = await getNearbyPlaces(lat, lon, 'restaurant');
  const opinions = await db.any('SELECT place_id, opinion FROM restaurants WHERE user_id = $1', [userId]);

  const likedPlaceIds = opinions.filter(e => e.opinion).map(e => e.place_id.trim());
  const dislikedPlaceIds = opinions.filter(e => !e.opinion).map(e => e.place_id.trim());

  res.render('pages/restaurants', {
    lat, lon, restaurants, likedPlaceIds, dislikedPlaceIds
  });
});

router.post('/restaurants/like', isAuthenticated, async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.session.user.id;
  const { placeId } = req.body;

  const existing = await db.oneOrNone('SELECT opinion FROM restaurants WHERE user_id = $1 AND place_id = $2', [userId, placeId]);

  if (existing) {
    await db.none('UPDATE restaurants SET opinion = $1 WHERE user_id = $2 AND place_id = $3', [true, userId, placeId]);
  } else {
    await db.none('INSERT INTO restaurants (user_id, place_id, opinion) VALUES ($1, $2, $3)', [userId, placeId, true]);
  }
  res.sendStatus(200);
});

router.post('/restaurants/dislike', isAuthenticated, async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.session.user.id;
  const { placeId } = req.body;

  const existing = await db.oneOrNone('SELECT opinion FROM restaurants WHERE user_id = $1 AND place_id = $2', [userId, placeId]);

  if (existing) {
    await db.none('UPDATE restaurants SET opinion = $1 WHERE user_id = $2 AND place_id = $3', [false, userId, placeId]);
  } else {
    await db.none('INSERT INTO restaurants (user_id, place_id, opinion) VALUES ($1, $2, $3)', [userId, placeId, false]);
  }
  res.sendStatus(200);
});

// -----------------------------
// ACTIVITIES ROUTES
// -----------------------------
router.get('/activities', isAuthenticated, async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.session.user.id;

  const userLocation = await db.oneOrNone(
    `SELECT ST_Y(user_location::geometry) AS latitude, ST_X(user_location::geometry) AS longitude 
     FROM profiles WHERE id = $1;`,
    [userId]
  );

  if (!userLocation) {
    return res.render('pages/explore', {
      message: 'Location not provided, please update your profile.',
      error: true
    });
  }

  const lat = userLocation.latitude;
  const lon = userLocation.longitude;

  const activityTypes = ['museum', 'park', 'tourist_attraction', 'art_gallery', 'amusement_park', 'aquarium', 'zoo', 'movie_theater', 'stadium', 'night_club', 'bowling_alley', 'casino'];
  let allActivities = [];

  for (const type of activityTypes) {
    const results = await getNearbyPlaces(lat, lon, type);
    allActivities = allActivities.concat(results);
  }

  // Filter out unwanted results by name
  const blockedKeywords = ['hotel', 'motel', 'inn', 'pharmacy', 'gas', 'court', 'market', 'store', 'walmart', 'target', 'best buy', 'auto', 'clinic', 'hospital', 'hardware'];
  allActivities = allActivities.filter(place => {
    const name = place.name.toLowerCase();
    return !blockedKeywords.some(keyword => name.includes(keyword));
  });

  // Shuffle the array
  allActivities = allActivities.sort(() => 0.5 - Math.random());

  const opinions = await db.any('SELECT place_id, opinion FROM activities WHERE user_id = $1', [userId]);
  const likedPlaceIds = opinions.filter(e => e.opinion).map(e => e.place_id.trim());
  const dislikedPlaceIds = opinions.filter(e => !e.opinion).map(e => e.place_id.trim());

  res.render('pages/activities', {
    lat, lon, activities: allActivities, likedPlaceIds, dislikedPlaceIds
  });
});

router.post('/activities/like', isAuthenticated, async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.session.user.id;
  const { placeId } = req.body;

  const existing = await db.oneOrNone('SELECT opinion FROM activities WHERE user_id = $1 AND place_id = $2', [userId, placeId]);

  if (existing) {
    await db.none('UPDATE activities SET opinion = $1 WHERE user_id = $2 AND place_id = $3', [true, userId, placeId]);
  } else {
    await db.none('INSERT INTO activities (user_id, place_id, opinion) VALUES ($1, $2, $3)', [userId, placeId, true]);
  }
  res.sendStatus(200);
});

router.post('/activities/dislike', isAuthenticated, async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.session.user.id;
  const { placeId } = req.body;

  const existing = await db.oneOrNone('SELECT opinion FROM activities WHERE user_id = $1 AND place_id = $2', [userId, placeId]);

  if (existing) {
    await db.none('UPDATE activities SET opinion = $1 WHERE user_id = $2 AND place_id = $3', [false, userId, placeId]);
  } else {
    await db.none('INSERT INTO activities (user_id, place_id, opinion) VALUES ($1, $2, $3)', [userId, placeId, false]);
  }
  res.sendStatus(200);
});

// --------------------------------------
// HELPER FUNCTION FOR PLACES API
// --------------------------------------
async function getNearbyPlaces(lat, lon, type) {
  const apiKey = process.env.MAP_API_KEY;
  const radius = 2500;
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=${type}&key=${apiKey}`;

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