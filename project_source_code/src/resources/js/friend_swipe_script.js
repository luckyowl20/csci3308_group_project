document.addEventListener('DOMContentLoaded', () => {
    // Grab key DOM elements used for swipe functionality and UI toggles
    const card = document.getElementById('card');
    const leftBtn = document.getElementById('left-swipe');
    const rightBtn = document.getElementById('right-swipe');
    const friendModal = document.getElementById('friend-modal'); // Changed to friend modal
    const closeFriendModal = document.getElementById('close-friend-modal'); // Changed to friend modal

        // Debug: Log all found elements
        console.log("Found elements:", {
            card, 
            leftBtn, 
            rightBtn, 
            friendModal, 
            closeFriendModal
        });

    // Debug log to see which user's profile is currently being shown
    if (card) {
        console.log("Current friend swipe card user ID:", card.dataset.userId);
    }

    // Handle closing the friend modal popup when user clicks the "close" button
    if (closeFriendModal) {
        closeFriendModal.addEventListener('click', () => {
            if (friendModal) friendModal.style.display = 'none';
            window.location.reload(); // Refresh page to load next profile
        });
    }

    // Main swipe handler function (called for both left and right swipes)
    async function handleFriendSwipe(isLiked) {
        if (!card) return;

        const userId = card.dataset.userId;
        console.log("Attempting friend swipe on user:", userId);

        // Animate card swipe direction and fade out
        card.style.transform = `translateX(${isLiked ? '100%' : '-100%'})`;
        card.style.opacity = '0';
        card.style.transition = 'all 0.3s ease';

        try {
            // Send swipe action to server via POST request
            const response = await fetch('/friends/swipe', { // Changed to friends endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    swipeeId: userId, // ID of the user being swiped on
                    isLiked: isLiked  // true if right swipe, false if left swipe
                })
            });

            const result = await response.json();

            // Check for server error
            if (!response.ok) throw new Error(result.message || 'Friend swipe failed');

            // If it's a friend connection, show the friend modal
            if (result.isFriend && friendModal) { // Changed to isFriend
                friendModal.style.display = 'flex';
            } else {
                // If not connected, wait for animation then load next profile
                setTimeout(() => window.location.href = '/friends', 300);
            }
        } catch (error) {
            // Handle errors and reload to allow retry
            console.error('Friend swipe failed:', error);
            alert(`Friend swipe error: ${error.message}`);
            setTimeout(() => window.location.href = '/friends', 300);
        }
    }

    // Add event listeners to swipe buttons
    // Button event listeners with robust checks
    if (leftBtn) {
        leftBtn.addEventListener('click', (e) => {
            console.log("Left button clicked", e);
            handleFriendSwipe(false);
        });
    } else {
        console.error("Left swipe button not found!");
    }

    if (rightBtn) {
        rightBtn.addEventListener('click', (e) => {
            console.log("Right button clicked", e);
            handleFriendSwipe(true);
        });
    } else {
        console.error("Right swipe button not found!");
    }


    // 🔽 Toggle view between profile details and user posts (same as original)
    const viewPostsBtn = document.getElementById('view-posts-btn');
    const viewProfileBtn = document.getElementById('view-profile-btn');
    const profileView = document.getElementById('profile-view');
    const postsCarousel = document.getElementById('posts-carousel');

    // When both toggle buttons and sections are present, enable toggling
    if (viewPostsBtn && viewProfileBtn && profileView && postsCarousel) {
        viewPostsBtn.addEventListener('click', function () {
            profileView.style.display = 'none';
            postsCarousel.style.display = 'block';
            viewPostsBtn.style.display = 'none';
            viewProfileBtn.style.display = 'block';
        });

        viewProfileBtn.addEventListener('click', function () {
            profileView.style.display = 'block';
            postsCarousel.style.display = 'none';
            viewPostsBtn.style.display = 'block';
            viewProfileBtn.style.display = 'none';
        });
    }
});