// root/project_source_code/src/resources/js/chatScript.js

document.addEventListener('DOMContentLoaded', () => {

  // Retrieve the chat box element and current user ID from its data attribute
  const chatBox = document.getElementById('chat-box');

  const currentUserId = parseInt(chatBox.getAttribute('data-current-user-id'), 10); // get current user id
  const chatPartnerId = parseInt(chatBox.getAttribute('data-chat-partner-id'), 10); // get chat partner id

  console.log("dom content loaded, attempting to connect to socket...")

  console.log('currentUserId from data attribute:', currentUserId);
  // Connect to the Socket.IO server
  const socket = io();
  console.log("socket connection established, attempting to join room...", currentUserId);

  // Have the client join its user-specific room on the server
  socket.emit('join', currentUserId);
  console.log("socket connection established, joined room:", currentUserId);

  // Listen for incoming messages and update the chat box accordingly by adding a new message bubble
  // adds a new message bubble when a message is received from the server when sent by another user
  socket.on('new message', (message) => {
    console.log('Received new message:', message);
    const isOutgoing = Number(message.sender_id) === currentUserId;
    const isFromCurrentPartner = Number(message.sender_id) === chatPartnerId;
    if (isOutgoing || isFromCurrentPartner) {
      const messageEl = document.createElement('div');
      messageEl.className = isOutgoing ? 'text-end mb-2' : 'text-start mb-2';
      messageEl.innerHTML = isOutgoing
        ? `<span class="message-bubble message-in font-alt">${message.content}</span>`
        : `<span class="message-bubble message-in font-alt">${message.content}</span>`;
      chatBox.appendChild(messageEl);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  });

  // CHANGE FRIENDS/MATCHES LOGIC
  // code for switching to matches
  const toggleBtn = document.getElementById("toggle-matches-btn");
  const heading = document.getElementById("sidebar-heading");
  const list = document.getElementById("sidebar-list");

  toggleBtn.addEventListener("click", async () => {
    const mode = toggleBtn.dataset.mode; // "friends" or "matches"
    console.log("button mode:", mode);
    try {
      const res = await fetch(`/chat/${mode === "friends" ? "matches" : "friends"}`, {
        headers: { "Accept": "application/json" }
      });
      console.log("got response 1", res);
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();

      // decide what to show
      const newMode = mode === "friends" ? "matches" : "friends";
      heading.textContent = newMode.charAt(0).toUpperCase() + newMode.slice(1);
      toggleBtn.textContent = `Show ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
      toggleBtn.dataset.mode = newMode;

      // clear & re-populate list
      list.innerHTML = "";
      data[newMode].forEach(user => {
        // 1) create a flex‐container li, centered vertically & horizontally
        const li = document.createElement("li");
        li.className = "mb-3 d-flex align-items-center justify-content-center";

        // 2) build the inner HTML
        li.innerHTML = `
          <div class="me-3">
            ${user.profile_picture_url
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
                  >`
          }
          </div>
          <a href="/chat/${user.id}"
            class="friend-chat-link font-alt primary-text fw-semibold">
            <span>${user.username}</span>
          </a>
        `;

        // 3) append into your UL
        list.appendChild(li);
      });

    } catch (err) {
      console.error("Failed to load", err);
    }
  });

  // CHAT FORM SUBMISSION LOGIC -- only if user selected a chat partner / if form exists
  const form = document.getElementById('chat-form');

  // prevents the form from forcing the page to reload 
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const receiver_id = formData.get('receiver_id');
      const message_text = formData.get('message_text');

      if (!receiver_id || !message_text.trim()) return;

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiver_id, message_text })
        });

        const data = await response.json();

        if (data.success) {
          // Remove "No messages yet." message if it's present
          const newMessage = data.message;
          const isOutgoing = Number(newMessage.sender_id) === currentUserId;
          console.log('New message sender:', newMessage.sender_id, 'Is outgoing:', isOutgoing);

          const noMessagesEl = document.getElementById('no-messages');
          if (noMessagesEl) {
            noMessagesEl.remove();
          }

          // Create a new message bubble element for the sender
          const messageEl = document.createElement('div');
          messageEl.className = isOutgoing ? 'text-end mb-2' : 'text-start mb-2';
          messageEl.innerHTML = isOutgoing
            ? `<span class="message-bubble message-out font-alt">${newMessage.content}</span>`
            : `<span class="message-bubble message-in font-alt">${newMessage.content}</span>`;

          // Append to chatBox, scroll, etc.
          chatBox.appendChild(messageEl);
          chatBox.scrollTop = chatBox.scrollHeight;

          // Clear the form
          form.reset();
        } else {
          console.error('Server error:', data.error);
        }

      } catch (err) {
        console.error('Failed to send message:', err);
      }
    });
  }
});

