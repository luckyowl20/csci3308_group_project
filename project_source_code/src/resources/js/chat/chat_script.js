// root/project_source_code/src/resources/js/chatScript.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chat-form');
  const chatBox = document.getElementById('chat-box');

  // Retrieve currentUserId from data attribute
  const currentUserId = parseInt(chatBox.getAttribute('data-current-user-id'), 10);
  console.log('currentUserId from data attribute:', currentUserId); // Debug

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
  
  