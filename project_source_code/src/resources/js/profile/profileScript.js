document.addEventListener('DOMContentLoaded', () => {
  // === Spotify search and profile updates logic ===
  // spotify search and modal elements
  const searchInput = document.getElementById('spotify-search');
  const resultsDiv = document.getElementById('spotify-results');
  const hiddenInput = document.getElementById('spotify_song_id_input');
  const selectedDisplay = document.getElementById('spotify-selected-display');
  const profileModal = document.getElementById('editProfileModal');

  if (!searchInput) return;

  let searchTimeout;

  // profile modal input liostener to see when user stops typing and search can be performed 
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
            <button class="btn btn-sm btn-outline-success mt-2" data-track-id="${track.id}">
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

  // Reset on profile modal close
  profileModal.addEventListener('hidden.bs.modal', () => {
    searchInput.value = '';
    resultsDiv.innerHTML = '';
    selectedDisplay.innerText = '';
  });

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

  // ===== Edit preferences logic =====
  const detectBtn = document.getElementById('detectLocationBtn');
  const locationInput = document.getElementById('location');
  const latitudeInput = document.getElementById('latitude');
  const longitudeInput = document.getElementById('longitude');

  if (detectBtn) {
    detectBtn.addEventListener('click', async () => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }

      detectBtn.disabled = true;
      detectBtn.textContent = "Detecting...";

      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;

        latitudeInput.value = latitude;
        longitudeInput.value = longitude;

        try {
          // Use a reverse geocoding API — here we use OpenStreetMap’s Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();

          const city = data.address.city || data.address.town || data.address.village || '';
          const state = data.address.state || '';
          const country = data.address.country || '';

          const locationText = [city, state, country].filter(Boolean).join(', ');
          locationInput.value = locationText;

          detectBtn.textContent = "Location Updated";
        } catch (err) {
          console.error("Failed to reverse geocode location:", err);
          alert("Could not determine your city. Please enter it manually.");
          detectBtn.textContent = "Update My Location";
        }

        detectBtn.disabled = false;
      }, (err) => {
        alert("Could not get your location. Please check permissions.");
        console.error(err);
        detectBtn.textContent = "Update My Location";
        detectBtn.disabled = false;
      });
    });
  }

  // === Match Distance slider display ===
  const distanceSlider = document.getElementById('match-distance');
  const distanceDisplay = document.getElementById('distance-display');

  if (distanceSlider && distanceDisplay) {
    const updateDistanceDisplay = (val) => {
      distanceDisplay.innerText = val >= 995 ? 'No limit' : `${val} miles`;
    };

    updateDistanceDisplay(distanceSlider.value);
    distanceSlider.addEventListener('input', (e) => {
      updateDistanceDisplay(e.target.value);
    });
  }

  // === Age Range input display ===
  const ageMin = document.getElementById('preferred_age_min');
  const ageMax = document.getElementById('preferred_age_max');
  const ageDisplay = document.getElementById('age-range-display');

  if (ageMin && ageMax && ageDisplay) {
    const updateAgeDisplay = () => {
      const min = parseInt(ageMin.value, 10);
      const max = parseInt(ageMax.value, 10);
      ageDisplay.innerText = isNaN(min) || isNaN(max) ? 'Any' : `${min} - ${max} years`;
    };

    ageMin.addEventListener('input', updateAgeDisplay);
    ageMax.addEventListener('input', updateAgeDisplay);
    updateAgeDisplay();
  }

  // friends / matches display logic
  const btn = document.getElementById('toggle-matches-btn');
  const list = document.getElementById('sidebar-list');
  const heading = document.getElementById('sidebar-heading');

  // grab the arrays we inlined
  const friends = window.__FRIENDS__ || [];
  const matches = window.__MATCHES__ || [];

  // current mode: either 'friends' or 'matches'
  let mode = 'friends';

  // initial render
  renderList(friends);

  btn.addEventListener('click', () => {
    if (mode === 'friends') {
      mode = 'matches';
      heading.textContent = 'Matches';
      btn.textContent = 'Show Friends';
      renderList(matches);
    } else {
      mode = 'friends';
      heading.textContent = 'Friends';
      btn.textContent = 'Show Matches';
      renderList(friends);
    }
    btn.setAttribute('data-mode', mode);
  });

  function renderList(items) {
    list.innerHTML = '';
    if (items.length) {
      items.forEach(user => {
        const li = document.createElement("li");
        li.className = "mb-3 d-flex align-items-center justify-content-center";

        // 1) profile picture HTML
        const profilePicHTML = user.profile_picture_url
          ? `<img
              src="${user.profile_picture_url}"
              alt="${user.username}'s profile picture"
              class="profile-pic rounded-circle"
              width="40"
              height="40"
            >`
          : `<img
              src="https://via.placeholder.com/40?text=U"
              alt="Default profile picture"
              class="profile-pic rounded-circle"
              width="40"
              height="40"
            >`;

        // 2) username display (as link or plain text)
        const usernameHTML = window.__OWN_PROFILE__
          ? `<a href="/profile/${user.id}" class="friend-chat-link font-alt primary-text fw-semibold">
            <span>${user.username}</span>
            </a>`
          : `<a class="font-alt primary-text fw-bold text-decoration-none"><span>${user.username}<span></a>`;

        // 3) combine and inject
        li.innerHTML = `
          <div class="me-3">
            ${profilePicHTML}
          </div>
          ${usernameHTML}
        `;
        list.appendChild(li);

      });
    } else {
      const li = document.createElement('li');
      li.className = 'fst-italic primary-text';
      li.textContent = mode === 'friends'
        ? 'No friends yet.'
        : 'No matches yet.';
      list.appendChild(li);
    }
  }

});
