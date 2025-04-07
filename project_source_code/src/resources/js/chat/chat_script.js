// root/project_source_code/src/resources/js/chatScript.js

document.addEventListener('DOMContentLoaded', () => {
  console.log("dom content loaded")
  // Connect to the Socket.IO server
  const socket = io();
  console.log("socket connection established");

  // Have the client join its user-specific room on the server
  socket.emit('join', currentUserId);

  // // Listen for incoming messages and update the chat box accordingly
  socket.on('new message', (message) => {
    console.log('Received new message:', message);
    const messageElement = document.createElement('div');
    messageElement.textContent = `${message.sender_id}: ${message.content}`;
    chatBox.appendChild(messageElement);
  });

  // Retrieve the chat box element and current user ID from its data attribute
  const chatBox = document.getElementById('chat-box');
  const currentUserId = parseInt(chatBox.getAttribute('data-current-user-id'), 10);
  console.log('currentUserId from data attribute:', currentUserId);

  // Get the chat form element
  const form = document.getElementById('chat-form');
  if (!form) return;

  // prevents the form from forcing the page to reload 
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
        const newMessage = data.message;
        const isOutgoing = Number(newMessage.sender_id) === currentUserId;
        console.log('New message sender:', newMessage.sender_id, 'Is outgoing:', isOutgoing);

        // Create a new message bubble element
        const messageEl = document.createElement('div');
        messageEl.className = isOutgoing ? 'text-end mb-2' : 'text-start mb-2';
        messageEl.innerHTML = isOutgoing
            ? `<span class="badge bg-primary">${newMessage.content}</span>`
            : `<span class="badge bg-secondary">${newMessage.content}</span>`;

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
});
  
  