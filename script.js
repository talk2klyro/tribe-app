// /script.js
// --- HTML Elements ---
const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');
const emailInput = document.getElementById('email-input');
const loginButton = document.getElementById('login-button');
const authStatus = document.getElementById('auth-status');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const messagesContainer = document.getElementById('messages');
const imageUpload = document.getElementById('image-upload');

// --- Global Variables ---
let loggedInUser = null;

// --- Magic & Ably Setup ---
const MAGIC_PUBLISHABLE_KEY = "your-magic-publishable-key";
const magic = new Magic(MAGIC_PUBLISHABLE_KEY);

const authUrl = '/api/ably-token';
const ably = new Ably.Realtime({
  authUrl: authUrl,
  authHeaders: { "x-did-token": null }
});

const chatChannel = ably.channels.get('chat-room');

// --- Functions ---
function addMessage(messageData, senderEmail, isSent) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isSent ? 'sent' : ''}`;
  
    const senderInfo = document.createElement('div');
    senderInfo.className = 'sender-info';
    senderInfo.textContent = isSent ? 'You' : senderEmail;
    messageElement.appendChild(senderInfo);

    if (messageData.text) {
        const messageText = document.createElement('span');
        messageText.textContent = messageData.text;
        messageElement.appendChild(messageText);
    }

    if (messageData.imageURL) {
        const messageImage = document.createElement('img');
        messageImage.src = messageData.imageURL;
        messageImage.className = 'chat-image';
        messageElement.appendChild(messageImage);
    }
  
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
// Function to fetch chat history from the database
async function fetchChatHistory() {
  try {
    const response = await fetch('/api/messages');
    const messages = await response.json();
    messages.forEach(msg => {
      const isSent = loggedInUser && loggedInUser.email === msg.email;
      addMessage(msg.data, msg.email, isSent);
    });
  } catch (err) {
    console.error('Failed to fetch chat history:', err);
  }
}

async function loginUser(email) {
  try {
    authStatus.textContent = 'Sending magic link... Check your email.';
    const didToken = await magic.auth.loginWithMagicLink({ email: email });
    authStatus.textContent = 'Token received. Logging in...';
    
    const response = await fetch('/api/magic-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ didToken })
    });

    if (response.ok) {
      const userData = await response.json();
      loggedInUser = userData;
      authStatus.textContent = `Logged in as: ${userData.email}`;
      showChatInterface();
      
      ably.auth.authorize({ authHeaders: { "x-did-token": didToken } });
      
      fetchChatHistory();

    } else {
      const errorText = await response.text();
      authStatus.textContent = `Login failed: ${errorText}`;
    }
  } catch (err) {
    console.error(err);
    authStatus.textContent = 'Login failed. Try again.';
  }
}

function showChatInterface() {
  loginContainer.classList.add('hidden');
  chatContainer.classList.remove('hidden');
  messageInput.focus();
}

// --- Event Listeners ---
loginButton.addEventListener('click', () => {
  const email = emailInput.value.trim();
  if (email) {
    loginUser(email);
  } else {
    authStatus.textContent = 'Please enter a valid email address.';
  }
});

sendButton.addEventListener('click', () => {
  const messageText = messageInput.value.trim();
  if (messageText && loggedInUser) {
    const messageData = { text: messageText, email: loggedInUser.email };
    chatChannel.publish('message', messageData);

    fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
    });

    messageInput.value = '';
  }
});

// NEW: Handle image upload
imageUpload.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file || !loggedInUser) return;
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (response.ok) {
      const result = await response.json();
      const messageData = { imageURL: result.url, email: loggedInUser.email };
      
      // Publish the message to Ably
      chatChannel.publish('message', messageData);
      
      // Save the message to the database
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });
      
    } else {
      console.error('Image upload failed.');
    }
  } catch (err) {
    console.error('Upload error:', err);
  }
});

chatChannel.subscribe('message', (message) => {
  const senderEmail = message.data.email || 'Anonymous';
  const isSent = loggedInUser && loggedInUser.email === senderEmail;
  addMessage(message.data, senderEmail, isSent);
});

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendButton.click();
  }
});

// Initial state
loginContainer.classList.remove('hidden');
chatContainer.classList.add('hidden');
