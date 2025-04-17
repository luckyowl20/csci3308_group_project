// const express = require('express');
// const router = express.Router();
// const { isAuthenticated } = require('../middleware/auth');


// router.get('/', isAuthenticated, async (req, res) => {
//   try {
    
//     res.render('pages/music',);
//   } catch (err) {
//     console.error('Error loading Explore Music page:', err);
//     res.status(500).send('Something went wrong loading the Explore Music page.');
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// Define an array of popular track IDs to use as fallback
const sampleTrackIds = [
  '4cOdK2wGLETKBW3PvgPWqT', // Random song
  '0SIAFU49FFHwR3QnT5Jx0k', // Another random song
  '1zi7xx7UVEFkmKfv06H8x0', // Another random song
  '6habFhsOp2NvshLv26DqMb', // Another random song
  '7qiZfU4dY1lWllzX7mPBI3' // Another random song
];

router.get('/', isAuthenticated, async (req, res) => {
  try {
    // Simply select a random track ID from our sample list
    const randomIndex = Math.floor(Math.random() * sampleTrackIds.length);
    const trackId = sampleTrackIds[randomIndex];
    
    console.log('Rendering music page with track ID:', trackId);
    
    // Render the page with the random track ID
    res.render('pages/music', {
      trackId: trackId
    });
  } catch (err) {
    console.error('Error loading Explore Music page:', err);
    res.status(500).send('Something went wrong loading the Explore Music page.');
  }
});

module.exports = router;