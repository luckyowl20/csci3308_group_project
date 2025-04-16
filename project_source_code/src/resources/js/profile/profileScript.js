document.addEventListener('DOMContentLoaded', () => {
  // === Spotify search and profile updates logic ===
  // spotify search and modal elements
  const searchInput = document.getElementById('spotify-search');
  const resultsDiv = document.getElementById('spotify-results');
  const hiddenInput = document.getElementById('spotify_song_id_input');
  const selectedDisplay = document.getElementById('spotify-selected-display');
  const modal = document.getElementById('editProfileModal');

  if (!searchInput) return;

  let searchTimeout;

  // modal input liostener to see when user stops typing and search can be performed 
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

  // === Picture viewer logic ===
  const panel = document.getElementById('viewerPanel');
  const slides = document.querySelectorAll('.day-slide');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (panel && slides.length && prevBtn && nextBtn) {
    let currentIndex = 0;

    const updateView = () => {
      const offset = -currentIndex * 150; // slide width
      panel.style.transform = `translateX(${offset}px)`;
      panel.style.transition = 'transform 0.3s ease';
    };

    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateView();
      }
    });

    nextBtn.addEventListener('click', () => {
      if (currentIndex < slides.length - 3) {
        currentIndex++;
        updateView();
      }
    });

    updateView();
  }

  // === Interests editor logic ===
  const interestsSearchInput = document.getElementById('interests-search');
  const resultsBox = document.getElementById('interest-results');
  const selectedBox = document.getElementById('selected-interests');
  const interestsHiddenInput = document.getElementById('interests-input');

  const selectedIds = new Set(
    Array.from(selectedBox.querySelectorAll('[data-id]')).map(btn => btn.dataset.id)
  );

  const updateHiddenInput = () => {
    const validIds = Array.from(selectedIds)
      .map(id => parseInt(id))
      .filter(id => !isNaN(id));
    interestsHiddenInput.value = validIds.join(',');
  };

  updateHiddenInput();

  // Enable removal of pre-selected interests (rendered server-side)
  selectedBox.querySelectorAll('.selected-interest').forEach(btn => {
    const id = btn.dataset.id;
    btn.addEventListener('click', () => {
      selectedIds.delete(String(id));
      btn.remove();
      updateHiddenInput();
    });
  });

  interestsSearchInput.addEventListener('input', async () => {
    console.log("Searching for interests...");
    const query = interestsSearchInput.value.trim();
    if (query.length === 0) return resultsBox.innerHTML = '';

    const res = await fetch(`/profile/search-interests?q=${encodeURIComponent(query)}`);
    const interests = await res.json();

    resultsBox.innerHTML = '';
    interests.forEach(interest => {
      if (!selectedIds.has(String(interest.id))) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline-success btn-sm';
        btn.textContent = interest.name;

        // when an interest is clicked, add it to the selected list
        btn.addEventListener('click', () => {
          selectedIds.add(String(interest.id));
          updateHiddenInput();

          const selectedBtn = document.createElement('button');
          selectedBtn.className = 'btn btn-sm btn-secondary selected-interest';
          selectedBtn.dataset.id = interest.id;
          selectedBtn.innerHTML = `${interest.name} &times;`;
          selectedBtn.addEventListener('click', () => {
            selectedIds.delete(String(interest.id));
            selectedBtn.remove();
            updateHiddenInput();
          });

          selectedBox.appendChild(selectedBtn);
          btn.remove(); // remove from search results
        });

        resultsBox.appendChild(btn);
      }
    });
  });

  // event listener to stop search field from submitting form
  interestsSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  });
});
