// spotify.js
const express = require('express');
const router = express.Router();
const { searchTracks } = require('../utils/spotify');

async function getAccessToken(clientId, clientSecret) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await res.json();
  return data.access_token;
}


router.get('/search', async (req, res) => {
  console.log("searching for a song")
  const q = req.query.q;
  if (!q) return res.json([]);

  try {
    const results = await searchTracks(q);
    // console.log("found something!", results);
    res.json(results); // You can clean/filter data if needed
  } catch (err) {
    console.error('Spotify search error:', err);
    res.status(500).json({ error: 'Failed to search Spotify' });
  }
});

module.exports = router;
