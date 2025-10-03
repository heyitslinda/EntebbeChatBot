const messagesDiv = document.getElementById('messages');
const userInput = document.getElementById('userInput');
const typingDiv = document.getElementById('typing');
const sendBtn = document.getElementById('sendBtn');

const WEBHOOK_URL = '/webhook'; // Will work with Render backend

const intentClasses = {
    'Flight Status': 'flight-status',
    'Navigation': 'navigation',
    'Baggage Info': 'baggage-info',
    'Transport Info': 'transport-info'
};

function appendMessage(sender, text, intent='') {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ' + sender;
    if (sender === 'bot' && intent) msgDiv.classList.add(intentClasses[intent] || '');

    messagesDiv.appendChild(msgDiv);
    msgDiv.textContent = text;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function getParameters(text) {
    const params = {};
    const flightRegex = /\b([A-Z]{2}\d{3,4})\b/;
    const match = text.toUpperCase().match(flightRegex);
    if (match) params['flight_number'] = match[1];

    const baggageWords = ['missing','lost','claim','carry','kg','weight'];
    if (baggageWords.some(w => text.toLowerCase().includes(w))) params['baggage_issue'] = text;

    const navWords = ['baggage','terminal','gate','lounge'];
    if (navWords.some(w => text.toLowerCase().includes(w))) params['location'] = text;

    const transportWords = ['taxi','bus','shuttle','city to airport','from city'];
    if (transportWords.some(w => text.toLowerCase().includes(w))) params['transport_type'] = text;

    return params;
}

function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    userInput.value = '';
    typingDiv.style.display = 'block';

    const payload = { queryResult: { queryText: text, parameters: getParameters(text), intent: { displayName: '' } } };

    fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        typingDiv.style.display = 'none';
        appendMessage('bot', data.fulfillmentText, data.intent);
    })
    .catch(err => {
        typingDiv.style.display = 'none';
        appendMessage('bot', 'Error connecting to chatbot.');
        console.error(err);
    });
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
