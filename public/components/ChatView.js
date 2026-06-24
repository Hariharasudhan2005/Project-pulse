import { AppState } from '../state.js';

export function renderChatView(container, state) {
  const messages = AppState.getMessagesForCurrentProject();
  const currentUser = AppState.getCurrentUser();
  const users = state.users;

  const messagesHTML = messages.map(m => {
    const isSelf = m.userId === currentUser.id;
    const sender = users.find(u => u.id === m.userId) || { name: m.userName, avatar: '?' };
    
    // Format timestamp
    let timeStr = '';
    if (m.timestamp) {
      const date = new Date(m.timestamp);
      timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return `
      <div class="chat-message ${isSelf ? 'self' : ''}">
        <div class="avatar-circle" style="width: 36px; height: 36px; font-size: 0.9rem; flex-shrink: 0; background: ${isSelf ? 'var(--secondary)' : 'var(--primary)'}; box-shadow: none;">
          ${sender.avatar}
        </div>
        <div class="chat-message-bubble">
          <div class="chat-message-info">
            <span class="chat-message-sender">${sender.name}</span>
            <span class="chat-message-time">${timeStr}</span>
          </div>
          <p class="chat-message-text">${m.text}</p>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="view-container">
      <div class="chat-container">
        <!-- Message list wrapper -->
        <div id="chat-messages-log" class="chat-messages-area">
          ${messages.length > 0 ? messagesHTML : `
            <div style="color: var(--text-dimmed); text-align: center; margin: auto; font-style: italic;">
              This is the beginning of the chat channel. Start writing messages!
            </div>
          `}
        </div>

        <!-- Chat Input area -->
        <div class="chat-input-area">
          <textarea id="chat-textarea" class="chat-input" placeholder="Type a message to team... (Press Enter to Send)"></textarea>
          <button id="chat-send-btn" class="btn-primary" style="height: 52px; border-radius: var(--border-radius-md); padding: 0 24px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Send
          </button>
        </div>
      </div>
    </div>
  `;

  // Auto scroll to bottom
  const log = container.querySelector('#chat-messages-log');
  if (log) {
    log.scrollTop = log.scrollHeight;
  }

  // Handle send message
  const textarea = container.querySelector('#chat-textarea');
  const sendBtn = container.querySelector('#chat-send-btn');

  const sendMessageTrigger = () => {
    const text = textarea.value.trim();
    if (text) {
      AppState.sendMessage(text);
      textarea.value = '';
    }
  };

  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessageTrigger);
  }

  if (textarea) {
    textarea.addEventListener('keydown', (e) => {
      // Enter sends, Shift+Enter inserts newline
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessageTrigger();
      }
    });
  }
}
