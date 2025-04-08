document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('spotify-search');
    const resultsDiv = document.getElementById('spotify-results');
    const hiddenInput = document.getElementById('spotify_song_id_input');

    if (!searchInput) return;

    let searchTimeout;

    searchInput.addEventListener('input', async (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value;

        if (!query || query.length < 3) {
        resultsDiv.innerHTML = '';
        return;
        }

        // debounce typing by 300ms
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
                width="100%" height="80" frameborder="0" allowtransparency="true"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy">
            </iframe>
            <button class="btn btn-sm btn-outline-primary mt-2" data-track-id="${track.id}">
                Use this song
            </button>
            `;

            // handle song selection
            preview.querySelector('button').addEventListener('click', () => {
            hiddenInput.value = track.id;
            alert(`Selected: ${track.name} by ${track.artists[0].name}`);
            });

            resultsDiv.appendChild(preview);
        });
        }, 300);
    });

    // Cleanup search bar and results on modal close
    modal.addEventListener('hidden.bs.modal', () => {
        searchInput.value = '';
        resultsDiv.innerHTML = '';
    });
});