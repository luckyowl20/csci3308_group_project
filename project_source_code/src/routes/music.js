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


// Handle both displaying music and recording opinions
router.all('/', isAuthenticated, async (req, res) => {
  // If it's a POST request, handle the opinion submission
  if (req.method === 'POST') {
    try {
      const { trackId, opinion } = req.body;
      const userId = req.user.id;
      const db = req.app.locals.db;
      
      // Validate opinion value
      if (opinion !== -1 && opinion !== 1) {
        return res.status(400).json({ error: 'Invalid opinion value' });
      }
      
      // Insert or update opinion in database
      await db.query(
        `INSERT INTO music (user_id, song_id, opinion) 
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, song_id) 
         DO UPDATE SET opinion = $3`,
        [userId, trackId, opinion]
      );
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error saving music opinion:', error);
      return res.status(500).json({ error: 'Failed to save opinion' });
    }
  }
  
  // Original GET functionality below
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

  // Check if the user has already rated this track
  let userOpinion = null;
  try {
    const opinionResult = await db.query(
      'SELECT opinion FROM music WHERE user_id = $1 AND song_id = $2',
      [req.user.id, trackId]
    );
    
    if (opinionResult.rows.length > 0) {
      userOpinion = opinionResult.rows[0].opinion;
    }
  } catch (dbError) {
    console.error('Error fetching user opinion:', dbError);
    // Continue without the opinion data
  }

  res.render('pages/music', {
    trackId,
    artist: artistQuery || '',
    userOpinion: userOpinion
  });
});


module.exports = router;