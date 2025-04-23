const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const axios = require('axios'); // Make sure to keep this import
const spotifyUtils = require('../utils/spotify');

// Fallback track IDs in case the API call fails
const fallbackTrackIds = [
  '4cOdK2wGLETKBW3PvgPWqT',
  '0SIAFU49FFHwR3QnT5Jx0k',
  '1zi7xx7UVEFkmKfv06H8x0',
  '6habFhsOp2NvshLv26DqMb',
  '7qiZfU4dY1lWllzX7mPBI3'
];

// GET route for displaying music
router.get('/', isAuthenticated, async (req, res) => {
  const db = req.app.locals.db;
  const artistQuery = req.query.artist;
  let trackId;
  let usedFallback = false;

  try {
    // Use the existing spotifyUtils to get a token, or fall back to your original method
    let token;
    try {
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      token = await spotifyUtils.getAccessToken(clientId, clientSecret);
    } catch (tokenErr) {
      console.warn('Error using spotifyUtils for token:', tokenErr.message);
      token = await getSpotifyToken(); // Your original function as backup
    }
    
    console.log("Spotify token obtained:", !!token); // Log if we have a token
    
    if (token) {
      if (artistQuery) {
        // Try to use existing spotifyUtils first
        try {
          const tracks = await spotifyUtils.searchTracksByArtist(token, artistQuery);
          if (tracks && tracks.length > 0) {
            const randomIndex = Math.floor(Math.random() * tracks.length);
            trackId = tracks[randomIndex].id;
            console.log(`Found track by artist ${artistQuery}:`, trackId);
          } else {
            throw new Error('No tracks found via spotifyUtils');
          }
        } catch (utilsError) {
          console.warn('Error with spotifyUtils artist search:', utilsError.message);
          // Fall back to direct API call
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
            console.log(`Found track by artist ${artistQuery} via direct API:`, trackId);
          } else {
            throw new Error('No artist results');
          }
        }
      } else {
        // Get a random track
        try {
          trackId = await getRandomTrack(token);
          console.log("Random track found:", trackId);
        } catch (randomError) {
          console.error('Error getting random track:', randomError);
          throw randomError;
        }
      }
    } else {
      throw new Error('No Spotify token available');
    }
  } catch (apiError) {
    console.warn('Falling back to sample tracks due to API error:', apiError.message);
    const randomIndex = Math.floor(Math.random() * fallbackTrackIds.length);
    trackId = fallbackTrackIds[randomIndex];
    usedFallback = true;
    console.log("Using fallback track:", trackId);
  }

  // Check if the user has already liked this track
  let userLiked = false;
  if (req.user && trackId) {
    try {
      const likeResult = await db.query(
        'SELECT liked FROM music WHERE user_id = $1 AND song_id = $2',
        [req.user.id, trackId]
      );
      
      // Handle different possible return formats
    if (likeResult && likeResult.rows && likeResult.rows.length > 0) {
      userLiked = likeResult.rows[0].liked;
    } else if (likeResult && Array.isArray(likeResult) && likeResult.length > 0) {
      userLiked = likeResult[0].liked;
    } else {
      console.log('No existing like record found');
    }
    } catch (dbError) {
      console.error('Error fetching user like status:', dbError);
    }
  }

  res.render('pages/music', {
    trackId,
    artist: artistQuery || '',
    userLiked: userLiked,
    usedFallback: usedFallback
  });
});

// POST route for saving likes/dislikes
router.post('/', isAuthenticated, async (req, res) => {
  const db = req.app.locals.db;
  
  try {
    const { trackId, liked } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!trackId) {
      return res.status(400).json({ error: 'trackId is required' });
    }

    // Convert liked to boolean if it's not already
    const likedBoolean = String(liked).toLowerCase() === 'true';
    const userId = req.user.id;
    
    // Insert or update like status in database
    await db.query(
      `INSERT INTO music (user_id, song_id, liked) 
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, song_id) 
       DO UPDATE SET liked = $3`,
      [userId, trackId, likedBoolean]
    );
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error saving music preference:', error);
    return res.status(500).json({ error: 'Failed to save preference', details: error.message });
  }
});

// Function to get Spotify access token (original function as backup)
async function getSpotifyToken() {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.warn('Spotify credentials not found in environment variables');
      return null;
    }
    
    console.log("Requesting Spotify token with credentials");
    
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
    
    console.log("Token received successfully");
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
    
    // Use a random offset to get different tracks each time (limit to lower number for reliability)
    const randomOffset = Math.floor(Math.random() * 200);
    
    console.log(`Searching for random ${randomGenre} track with offset ${randomOffset}`);
    
    const response = await axios({
      method: 'get',
      url: 'https://api.spotify.com/v1/search',
      params: {
        q: `genre:${randomGenre}`,
        type: 'track',
        limit: 1,
        offset: randomOffset,
        market: 'US'
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
      console.log("Falling back to recommendations API");
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
    console.error('Error getting random track:', error);
    throw error;
  }
}

// Add these routes to your music router file

// Handle dislikes
router.get('/dislike', isAuthenticated, async (req, res) => {
  try {
    // console.log('User object:', req.user);
    // console.log('Session:', req.session);
    
    const trackId = req.query.trackId;
    if (!trackId) {
      return res.status(400).send('Track ID is required');
    }
    
    // Simplify for testing - avoid using req.user properties at first
    // Get the user ID from session directly
    // const userId = req.session.user ? req.session.user.id : null; dont need this since we know there is a user bc of isAuthenticated middleware
    const userId = req.session.user.id;
    console.log('Using userId from session:', userId);
    
    if (!userId) {
      return res.status(401).send('Cannot identify user');
    }
    
    const db = req.app.locals.db;
    
    // Log the query we're about to execute
    console.log(`Executing query: INSERT INTO music (user_id, song_id, liked) VALUES (${userId}, ${trackId}, false) ON CONFLICT...`);
    
    await db.query(
      `INSERT INTO music (user_id, song_id, liked) 
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, song_id) 
       DO UPDATE SET liked = $3`,
      [userId, trackId, false]
    );
    
    console.log('Database update successful for music');
    res.redirect('/explore/music');
  } catch (error) {
    console.error('Error in simplified dislike route:', error);
    res.status(500).send(`Error saving preference: ${error.message}`);
  }
});
// Handle likes - same change here
router.get('/like', isAuthenticated, async (req, res) => {
  const db = req.app.locals.db;
  const trackId = req.query.trackId;
  const userId = req.session.user.id;
  
  try {
    if (!trackId) {
      return res.status(400).send('Track ID is required');
    }
    
    // Use req.user.id consistently
    await db.query(
      `INSERT INTO music (user_id, song_id, liked) 
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, song_id) 
       DO UPDATE SET liked = $3`,
      [userId, trackId, true]
    );
    
    // Redirect back to the music page
    res.redirect('/explore/music');
  } catch (error) {
    console.error('Error saving like:', error);
    res.status(500).send('Error saving preference');
  }
});

module.exports = router;