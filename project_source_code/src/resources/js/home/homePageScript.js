// public/js/homePageScripts.js

// Alert when user hasn’t posted today
function alertMustPost() {
    alert("You must upload a photo today to access this feature.");
}

// AJAX-powered “like” buttons
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".like-button").forEach(button => {
      button.addEventListener("click", async () => {
        const postId   = button.getAttribute("data-post-id");
        const icon     = button.querySelector("i");
        const countSpan = button.nextElementSibling; // the <span> right after the button
  
        try {
          const res = await fetch(`/home/posts/${postId}/like`, {
            method: "POST",
            headers: { "Accept": "application/json" }
          });
  
          if (!res.ok) {
            alert("Something went wrong.");
            return;
          }
  
          const { liked, likeCount } = await res.json();
  
          // swap classes on the <i> for filled vs outline
          if (liked) {
            icon.classList.remove("bi-heart");
            icon.classList.add("bi-heart-fill", "text-danger");
          } else {
            icon.classList.remove("bi-heart-fill", "text-danger");
            icon.classList.add("bi-heart");
          }
  
          // update the count text, handling singular/plural
          countSpan.textContent = `${likeCount} like${likeCount === 1 ? "" : "s"}`;
        } catch (err) {
          console.error("Error:", err);
          alert("Failed to toggle like.");
        }
      });
    });
  });

