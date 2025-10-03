const messagesDiv = document.getElementById('messages');
const userInput = document.getElementById('userInput');
const typingDiv = document.getElementById('typing');

// Replace with your Render deployment URL
const WEBHOOK_URL = 'https://entebbechatbot-1.onrender.com/webhook';

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
    
    const iconSpan = document.createElement('span');
    iconSpan.style.fontSize = '20px';

    if (sender === 'user') {
        iconSpan.textContent = '🧑';
        msgDiv.appendChild(document.createTextNode(text));
        msgDiv.appendChild(iconSpan);
    } else {
        iconSpan.textContent = '✈️';
        msgDiv.appendChild(iconSpan);
        msgDiv.appendChild(document.createTextNode(text));
    }

    messagesDiv.appendChild(msgDiv);
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

    const params = getParameters(text);

    const payload = {
        queryResult: {
            queryText: text,
            parameters: params,
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
        const reply = data.fulfillmentText || "Sorry, I didn't understand that.";
        const intent = data.intent || '';
        appendMessage('bot', reply, intent);
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
