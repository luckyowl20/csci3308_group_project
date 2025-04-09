document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('spotify-search');
    const resultsDiv = document.getElementById('spotify-results');
    const hiddenInput = document.getElementById('spotify_song_id_input');
    const selectedDisplay = document.getElementById('spotify-selected-display');
    const modal = document.getElementById('editProfileModal');
  
    if (!searchInput) return;
  
    let searchTimeout;
  
    searchInput.addEventListener('input', async (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value;
  
      if (!query || query.length < 3) {
        resultsDiv.innerHTML = '';
        return;
      }
  
      // debounce typing
      searchTimeout = setTimeout(async () => {
        const res = await fetch(`/spotify/search?q=${encodeURIComponent(query)}`);
        const tracks = await res.json();
  
        resultsDiv.innerHTML = '';
  
        tracks.forEach(track => {
          const preview = document.createElement('div');
          preview.className = "card mb-2 p-2";
          preview.innerHTML = `
            <strong>${track.name}</strong> – ${track.artists.map(a => a.name).join(', ')}
            <iframe src="https://open.spotify.com/embed/track/${track.id}"
              width="100%" height="80" frameborder="0"
              allowtransparency="true" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy">
            </iframe>
            <button class="btn btn-sm btn-outline-primary mt-2" data-track-id="${track.id}">
              Use this song
            </button>
          `;
  
          // select song logic
          preview.querySelector('button').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            hiddenInput.value = track.id;
            console.log("Selected track ID:", track.id);

            selectedDisplay.innerText = `🎵 Selected: ${track.id} by ${track.artists[0].name}`;
          });
  
          resultsDiv.appendChild(preview);
        });
      }, 300);
    });
  
    // Reset on modal close
    modal.addEventListener('hidden.bs.modal', () => {
      searchInput.value = '';
      resultsDiv.innerHTML = '';
      selectedDisplay.innerText = '';
    });
  });
  