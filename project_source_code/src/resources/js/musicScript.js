document.addEventListener('DOMContentLoaded', function() {
    const currentTrackIdElement = document.getElementById('current-track-id');
    
    // Make sure we have the element before proceeding
    if (!currentTrackIdElement) {
        console.error('Could not find current-track-id element');
        return;
    }
    
    const currentTrackId = currentTrackIdElement.value;
    console.log('Loaded track ID:', currentTrackId);
    
    // Dislike button handler
    const dislikeButton = document.getElementById('left-swipe');
    if (dislikeButton) {
        dislikeButton.addEventListener('click', function() {
            console.log('Dislike button clicked');
            savePreference(currentTrackId, false)
                .then(() => {
                    console.log('Dislike saved successfully');
                    window.location.reload();
                })
                .catch(error => {
                    console.error('Error saving dislike:', error);
                    window.location.reload(); // Still reload even if saving fails
                });
        });
    }
  
    // Like button handler
    const likeButton = document.getElementById('right-swipe');
    if (likeButton) {
        likeButton.addEventListener('click', function() {
            console.log('Like button clicked');
            savePreference(currentTrackId, true)
                .then(() => {
                    console.log('Like saved successfully');
                    alert('Liked this track!');
                    window.location.reload();
                })
                .catch(error => {
                    console.error('Error saving like:', error);
                    alert('Error saving like, but we\'ll refresh anyway');
                    window.location.reload(); // Still reload even if saving fails
                });
        });
    }
});
  
// Function to save user's music preference
async function savePreference(trackId, liked) {
    if (!trackId) {
        console.error('No track ID provided for saving preference');
        return Promise.reject(new Error('No track ID provided'));
    }
    
    console.log(`Saving preference: ${liked ? 'Liked' : 'Disliked'} for track: ${trackId}`);
    
    try {
        const response = await fetch('/explore/music', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Make sure to include any CSRF token if your app requires it
            },
            // This is crucial - ensures cookies (including session) are sent
            credentials: 'same-origin',
            body: JSON.stringify({ trackId, liked })
        });
        
        if (!response.ok) {
            // Check specifically for auth errors
            if (response.status === 401) {
                throw new Error('Authentication error - please log in again');
            }
            const errorData = await response.json();
            throw new Error(`Failed to save preference: ${errorData.error || response.statusText}`);
        }
        
        return response.json();
    } catch (error) {
        console.error('Error in savePreference:', error);
        throw error;
    }
}