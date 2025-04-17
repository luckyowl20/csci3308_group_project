const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const axios = require('axios'); // Make sure to install this: npm install axios

// Fallback track IDs in case the API call fails
const fallbackTrackIds = [
  '4cOdK2wGLETKBW3PvgPWqT',
  '0SIAFU49FFHwR3QnT5Jx0k',
  '1zi7xx7UVEFkmKfv06H8x0',
  '6habFhsOp2NvshLv26DqMb',
  '7qiZfU4dY1lWllzX7mPBI3'
];

// Function to get Spotify access token
async function getSpotifyToken() {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.warn('Spotify credentials not found in environment variables');
      return null;
    }
    
    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      params: {
        grant_type: 'client_credentials'
      },
      headers: {
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Spotify token:', error.message);
    return null;
  }
}

// Function to get a random track from Spotify
async function getRandomTrack(token) {
  try {
    // List of possible genres to use as seeds
    const genres = [
      'pop', 'rock', 'hip-hop', 'electronic', 'jazz', 
      'classical', 'country', 'r-n-b', 'indie', 'folk',
      'metal', 'blues', 'reggae', 'punk', 'ambient'
    ];
    
    // Select a random genre
    const randomGenre = genres[Math.floor(Math.random() * genres.length)];
    
    // Use a random offset to get different tracks each time
    const randomOffset = Math.floor(Math.random() * 1000);
    
    const response = await axios({
      method: 'get',
      url: 'https://api.spotify.com/v1/search',
      params: {
        q: `genre:${randomGenre}`,
        type: 'track',
        limit: 1,
        offset: randomOffset,
        market: 'US' // or your preferred market
      },
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    
    if (response.data.tracks && response.data.tracks.items.length > 0) {
      return response.data.tracks.items[0].id;
    } else {
      console.warn('No tracks found for genre:', randomGenre);
      
      // Try recommendations API as a backup option
      const recResponse = await axios({
        method: 'get',
        url: 'https://api.spotify.com/v1/recommendations',
        params: {
          seed_genres: randomGenre,
          limit: 1
        },
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      
      if (recResponse.data.tracks && recResponse.data.tracks.length > 0) {
        return recResponse.data.tracks[0].id;
      }
      
      throw new Error('No tracks found');
    }
  } catch (error) {
    console.error('Error getting random track:', error.message);
    throw error;
  }
}

// router.get('/', isAuthenticated, async (req, res) => {
//   try {
//     let trackId;
    
//     // Try to get a track from the Spotify API
//     try {
//       const token = await getSpotifyToken();
      
//       if (token) {
//         trackId = await getRandomTrack(token);
//       } else {
//         throw new Error('No Spotify token available');
//       }
//     } catch (apiError) {
//       console.warn('Falling back to sample tracks due to API error:', apiError.message);
//       // Fallback to sample tracks if the API call fails
//       const randomIndex = Math.floor(Math.random() * fallbackTrackIds.length);
//       trackId = fallbackTrackIds[randomIndex];
//     }
    
//     console.log('Rendering music page with track ID:', trackId);
    
//     // Render the page with the track ID
//     res.render('pages/music', {
//       trackId: trackId
//     });
//   } catch (err) {
//     console.error('Error loading Explore Music page:', err);
//     res.status(500).send('Something went wrong loading the Explore Music page.');
//   }
// });

router.get('/', isAuthenticated, async (req, res) => {
  const artistQuery = req.query.artist;
  let trackId;

  try {
    const token = await getSpotifyToken();
    
    if (token) {
      if (artistQuery) {
        // Search for a track by the given artist
        const response = await axios({
          method: 'get',
          url: 'https://api.spotify.com/v1/search',
          params: {
            q: `artist:${artistQuery}`,
            type: 'track',
            limit: 10,
            market: 'US'
          },
          headers: {
            'Authorization': 'Bearer ' + token
          }
        });

        const tracks = response.data.tracks.items;
        if (tracks.length > 0) {
          const randomIndex = Math.floor(Math.random() * tracks.length);
          trackId = tracks[randomIndex].id;
        } else {
          console.warn('No tracks found for artist:', artistQuery);
          throw new Error('No artist results');
        }
      } else {
        // Default random track
        trackId = await getRandomTrack(token);
      }
    } else {
      throw new Error('No Spotify token available');
    }
  } catch (apiError) {
    console.warn('Falling back to sample tracks due to API error:', apiError.message);
    const randomIndex = Math.floor(Math.random() * fallbackTrackIds.length);
    trackId = fallbackTrackIds[randomIndex];
  }

  res.render('pages/music', {
    trackId,
    artist: artistQuery || ''
  });
});


module.exports = router;