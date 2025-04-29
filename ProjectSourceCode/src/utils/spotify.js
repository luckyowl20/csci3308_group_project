// utils/spotify.js
const { getAccessToken } = require('./getSpotifyToken');

async function searchTracks(query) {
  const token = await getAccessToken(
    process.env.SPOTIFY_CLIENT_ID,
    process.env.SPOTIFY_CLIENT_SECRET
  );

  const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await res.json();
  return data.tracks.items; // an array of tracks
}


module.exports = { getAccessToken, searchTracks };
