const messagesDiv = document.getElementById('messages');
const userInput = document.getElementById('userInput');
const typingDiv = document.getElementById('typing');

// Set this to your deployed URL later
const WEBHOOK_URL = 'https://entebbechatbot-1.onrender.com/webhook';

function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ' + sender;
    msgDiv.textContent = text;
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    userInput.value = '';
    typingDiv.style.display = 'block';

    const payload = {
        queryResult: {
            queryText: text,
            parameters: {},
            intent: { displayName: '' }
        }
    };

    fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        typingDiv.style.display = 'none';
        appendMessage('bot', data.fulfillmentText || "Sorry, I didn't understand that.");
    })
    .catch(err => {
        typingDiv.style.display = 'none';
        appendMessage('bot', "Error connecting to chatbot.");
        console.error(err);
    });
}

userInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
});
