document.addEventListener('DOMContentLoaded', () => {
    // Grab key DOM elements used for swipe functionality and UI toggles
    const card = document.getElementById('card');
    const leftBtn = document.getElementById('left-swipe');
    const rightBtn = document.getElementById('right-swipe');
    const matchModal = document.getElementById('match-modal');
    const closeMatchModal = document.getElementById('close-match-modal');

    // Debug log to see which user's profile is currently being shown
    if (card) {
        console.log("[SwipeDebug] Current swipe card user ID:", card.dataset.userId);
    }

    // Handle closing the match modal popup when user clicks the "close" button
    if (closeMatchModal) {
        closeMatchModal.addEventListener('click', () => {
            if (matchModal) matchModal.style.display = 'none';
            window.location.reload(); // Reload to get next profile
        });
    }

    // Main swipe handler function (called for both left and right swipes)
    async function handleSwipe(isLiked) {
        if (!card) return;

        const userId = card.dataset.userId;
        console.log("[SwipeDebug] Attempting swipe on user:", userId);

        // Animate card swipe direction and fade out
        card.style.transform = `translateX(${isLiked ? '100%' : '-100%'})`;
        card.style.opacity = '0';
        card.style.transition = 'all 0.3s ease';

        try {
            // Send swipe action to server via POST request
            const response = await fetch('/swipe/swipe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    swipeeId: userId, // ID of the user being swiped on
                    isLiked: isLiked  // true if right swipe, false if left swipe
                })
            });

            const result = await response.json();

            // Check for server error
            if (!response.ok) throw new Error(result.message || 'Swipe failed');

            // If it's a match, show the match modal
            if (result.isMatch && matchModal) {
                matchModal.style.display = 'flex';
            } else {
                // If not a match, wait for animation then load next profile
                setTimeout(() => window.location.href = '/swipe', 300);
            }
        } catch (error) {
            // Handle errors and reload to allow retry
            console.error('[SwipeDebug] Swipe failed:', error);
            alert(`Swipe error: ${error.message}`);
            setTimeout(() => window.location.href = '/swipe', 300);
        }
    }

    // Add event listeners to swipe buttons
    if (leftBtn) leftBtn.addEventListener('click', () => handleSwipe(false)); // Left swipe = dislike
    if (rightBtn) rightBtn.addEventListener('click', () => handleSwipe(true));  // Right swipe = like

    // 🔽 Toggle view between profile details and user posts
    const viewPostsBtn = document.getElementById('view-posts-btn');
    const viewProfileBtn = document.getElementById('view-profile-btn');
    const profileView = document.getElementById('profile-view');
    const postsCarousel = document.getElementById('posts-carousel');

    // When both toggle buttons and sections are present, enable toggling
    if (viewPostsBtn && viewProfileBtn && profileView && postsCarousel) {
        viewPostsBtn.addEventListener('click', function () {
            profileView.style.display = 'none';       // Hide profile section
            postsCarousel.style.display = 'block';    // Show posts carousel
            viewPostsBtn.style.display = 'none';      // Hide "View Posts" button
            viewProfileBtn.style.display = 'block';   // Show "Back to Profile" button
        });

        viewProfileBtn.addEventListener('click', function () {
            profileView.style.display = 'block';      // Show profile section
            postsCarousel.style.display = 'none';     // Hide posts carousel
            viewPostsBtn.style.display = 'block';     // Show "View Posts" button
            viewProfileBtn.style.display = 'none';    // Hide "Back to Profile" button
        });
    }
});
