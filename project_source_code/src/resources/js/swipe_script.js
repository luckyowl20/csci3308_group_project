document.addEventListener('DOMContentLoaded', () => {
    const card = document.getElementById('card');
    const leftBtn = document.getElementById('left-swipe');
    const rightBtn = document.getElementById('right-swipe');
    const matchModal = document.getElementById('match-modal');
    const closeMatchModal = document.getElementById('close-match-modal');

    // Debug: Log current card user
    if (card) {
        console.log("Current swipe card user ID:", card.dataset.userId);
    }

    // Handle match modal close
    if (closeMatchModal) {
        closeMatchModal.addEventListener('click', () => {
            if (matchModal) matchModal.style.display = 'none';
            window.location.reload();
        });
    }

    // Handle swipe actions
    async function handleSwipe(isLiked) {
        if (!card) return;
        
        const userId = card.dataset.userId;
        console.log("Attempting swipe on user:", userId);

        // Validate we're not swiping ourselves
        if (userId === "1") { // Replace "1" with actual current user ID if available
            alert("Error: Cannot swipe on yourself");
            window.location.reload();
            return;
        }

        // Swipe animation
        card.style.transform = `translateX(${isLiked ? '100%' : '-100%'})`;
        card.style.opacity = '0';
        card.style.transition = 'all 0.3s ease';

        try {
            const response = await fetch('/swipe/swipe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    swipeeId: userId,
                    isLiked: isLiked
                })
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.message || 'Swipe failed');

            if (result.isMatch && matchModal) {
                matchModal.style.display = 'flex';
            } else {
                // Load next profile after animation completes
                setTimeout(() => window.location.reload(), 300);
            }
        } catch (error) {
            console.error('Swipe failed:', error);
            alert(`Swipe error: ${error.message}`);
            setTimeout(() => window.location.reload(), 300);
        }
    }

    // Event listeners
    if (leftBtn) leftBtn.addEventListener('click', () => handleSwipe(false));
    if (rightBtn) rightBtn.addEventListener('click', () => handleSwipe(true));
});