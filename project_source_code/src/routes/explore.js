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
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).send('Latitude and longitude are required.');
    }

    console.log('User location:', lat, lon);

    // 🔍 TODO: Replace with real DB or API query to find nearby restaurants
    const nearbyRestaurants = await getMockNearbyRestaurants(lat, lon);

    // Render the page with the data
    res.render('pages/restaurants', {
      lat,
      lon,
      restaurants: nearbyRestaurants
    });

  } catch (err) {
    console.error('Error loading nearby restaurants:', err);
    res.status(500).send('Something went wrong loading nearby restaurants.');
  }
});

// You can move this to a separate file if needed
async function getMockNearbyRestaurants(lat, lon) {
  // This is just fake data for testing
  return [
    { name: 'Pizza Palace', distance: '0.3 miles' },
    { name: 'Sushi World', distance: '0.5 miles' },
    { name: 'Burger Shack', distance: '0.6 miles' }
  ];
}

module.exports = router;