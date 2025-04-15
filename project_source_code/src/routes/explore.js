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

// GET /restaurants/loc - Show nearby restaurants based on user location
router.get('/restaurants/loc', isAuthenticated, async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).send("Missing coordinates.");

  const restaurants = await getNearbyRestaurants(lat, lon);

  res.render('pages/restaurants', {
    lat, lon, restaurants
  });

  console.log(restaurants);
});

const axios = require('axios');

async function getNearbyRestaurants(lat, lon) {
  const apiKey = process.env.MAP_API_KEY;
  const radius = 2000; // meters

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=restaurant&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    return response.data.results.map(place => ({
      name: place.name,
      address: place.vicinity,
      rating: place.rating,
      photo: place.photos?.[0]?.photo_reference
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
      : null
    }));
  } catch (error) {
    console.error('Google Places API error:', error.response?.data || error.message);
    return [];
  }
} 


module.exports = router;