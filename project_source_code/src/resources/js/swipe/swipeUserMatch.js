document.addEventListener('DOMContentLoaded', () => {
    // Grab references to your DOM nodes
    const cardContainer = document.getElementById('swipe-card-container');
    const likeBtn       = document.getElementById('like-btn');
    const dislikeBtn    = document.getElementById('dislike-btn');
    console.log("dom content loaded");
  
    // Parse the full array of matches you embedded in a <script type="application/json">
    const matches = JSON.parse(
      document.getElementById('matches-data').textContent
    );
    let currentIndex = 0;
  
    // Re‑use your Handlebars partial on the client
    const templateSource = document.getElementById('swipe-template').innerHTML;
    const template       = Handlebars.compile(templateSource);
  
    // Helper to swap in the match at `matches[idx]`
    function renderMatch(idx) {
      const m = matches[idx];
      if (!m) {
        cardContainer.innerHTML = `
          <p class="font-alt primary-text text-center">
            No more candidates.
          </p>`;
        likeBtn.disabled = dislikeBtn.disabled = true;
        return;
      }
      cardContainer.innerHTML = template(m);
    }
  
    // The “swipe” brain:
    //  • sends a POST to /swipe/:type 
    //  • then advances currentIndex and re‑renders
    async function handleSwipe(isLiked) {
      const { candidate } = matches[currentIndex];
      const swipeType     = window.swipeType/* e.g. 'match' or 'friend'—derive from your URL or config */;
      console.log("button pressed, liked=", isLiked, swipeType);
      // 1) Tell the server
      await fetch(`/swipe/${swipeType}`, {
        method:  'POST',
        headers: {'Content-Type':'application/json'},
        body:    JSON.stringify({
          swipeeId: candidate.user_id,
          isLiked
        })
      });
  
      // 2) Move forward in the local array
      currentIndex++;
  
      // 3) Show the next card
      renderMatch(currentIndex);
    }
  
    // Wire your buttons
    likeBtn   .addEventListener('click', () => handleSwipe(true));
    dislikeBtn.addEventListener('click', () => handleSwipe(false));
  
    // Initial draw (if you didn’t render server‑side)
    renderMatch(currentIndex);
  });