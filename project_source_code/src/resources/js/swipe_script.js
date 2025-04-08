document.addEventListener('DOMContentLoaded', () => {
    const card = document.getElementById('card');
    const leftBtn = document.getElementById('left-swipe');
    const rightBtn = document.getElementById('right-swipe');
    const matchModal = document.getElementById('match-modal');

    if (!card) return; // Exit if no users left

    leftBtn.addEventListener('click', () => handleSwipe(false));
    rightBtn.addEventListener('click', () => handleSwipe(true));

    async function handleSwipe(isLiked) {
        const userId = card.dataset.userId; // Make sure this isn't the same as current user
        console.log("Swiping on user:", userId); // Add this for debugging
        
        // Swipe animation
        card.style.transform = `translateX(${isLiked ? '100%' : '-100%'})`;
        card.style.transition = 'transform 0.3s ease';

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

            if (result.isMatch) {
                // Show match modal if it exists
                if (matchModal) {
                    matchModal.style.display = 'flex';
                } else {
                    alert("It's a match!"); // Fallback
                }
            } else {
                // Load next user after delay
                setTimeout(() => {
                    window.location.reload();
                }, 300);
            }
        } catch (error) {
            console.error('Swipe failed:', error);
            setTimeout(() => {
                window.location.reload();
            }, 300);
        }
    }
});