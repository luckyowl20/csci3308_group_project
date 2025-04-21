// public/js/memoriesPageScripts.js

// Open the “Memory” modal and load likes via AJAX
async function openMemoryModal(url, caption, likeCount, postId) {
    const modal = document.getElementById('memoryModal');
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    const modalLikeCount = document.getElementById('modalLikeCount');
    const modalLikesList = document.getElementById('modalLikesList');
  
    // Populate modal fields
    modalImage.src = url;
    modalCaption.textContent = caption || "No caption";
    modalLikeCount.textContent = likeCount;
    modalLikesList.innerHTML = '';
    modalLikesList.classList.add('d-none');
  
    // Show modal
    modal.classList.remove('d-none');
  
    // Fetch and list users who liked this post
    try {
      const res = await fetch(`/likes/${postId}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const users = await res.json();
      users.forEach(user => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.textContent = user.display_name || user.username;
        modalLikesList.appendChild(li);
      });
    } catch (err) {
      console.error('Error fetching likes:', err);
    }
  }
  
  // Toggle display of the likes list in the modal
  function toggleLikesList() {
    document.getElementById('modalLikesList').classList.toggle('d-none');
  }
  
  // Close the memory modal
  function closeMemoryModal() {
    document.getElementById('memoryModal').classList.add('d-none');
  }
  