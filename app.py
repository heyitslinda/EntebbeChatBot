import os
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Mock flight database
flights = [
    {"flight": "KA456", "destination": "Nairobi", "status": "On time", "departure": "15:45", "gate": "4"},
    {"flight": "UR123", "destination": "Kampala", "status": "Delayed", "departure": "16:30", "gate": "2"},
    {"flight": "ET789", "destination": "Addis Ababa", "status": "Boarding", "departure": "14:20", "gate": "7"},
    {"flight": "AF789", "destination": "Paris", "status": "On time", "departure": "22:10", "gate": "9"}
]

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/webhook', methods=['POST'])
def webhook():
    req = request.get_json(silent=True, force=True)
    intent = req.get('queryResult', {}).get('intent', {}).get('displayName', '')
    response_text = "Sorry, I didn’t understand that. Can you rephrase?"

    def extract_param(param_name):
        param = req.get('queryResult', {}).get('parameters', {}).get(param_name)
        if isinstance(param, list):
            return str(param[0]).strip() if param else None
        elif param:
            return str(param).strip()
        return None

    # ----- FLIGHT STATUS -----
    if intent == 'Flight Status':
        flight_number = extract_param('flight_number')
        if flight_number:
            flight_number_norm = flight_number.replace(" ", "").lower()
            flight_info = next(
                (f for f in flights if f['flight'].replace(" ", "").lower() == flight_number_norm),
                None
            )
            if flight_info:
                response_text = (
                    f"✈️ Flight {flight_info['flight']} to {flight_info['destination']} is "
                    f"{flight_info['status']}, departing at {flight_info['departure']} from Gate {flight_info['gate']}."
                )
            else:
                response_text = f"Sorry, I couldn’t find flight {flight_number} in the system."
        else:
            response_text = "Please provide the flight number so I can check its status."

    # ----- NAVIGATION -----
    elif intent == 'Navigation':
        location = extract_param('location')
        if location:
            loc = location.lower()
            synonyms = {
                'baggage claim': ['baggage', 'baggage hall', 'luggage area', 'claim'],
                'terminal a': ['terminal a', 'terminal-a'],
                'departure lounge': ['lounge', 'departure area'],
                'gate 5': ['gate 5', 'gate five']
            }
            mapped_location = None
            for key, syns in synonyms.items():
                if loc in syns:
                    mapped_location = key
                    break
            nav_responses = {
                'baggage claim': "Baggage claim is on the ground floor near the arrivals hall.",
                'terminal a': "Terminal A is on your left after you enter the airport main entrance.",
                'departure lounge': "The departure lounge is on the first floor, above check-in counters.",
                'gate 5': "Gate 5 is located at the right wing of the terminal."
            }
            if mapped_location:
                response_text = nav_responses[mapped_location]
            else:
                response_text = "Sorry, I don't have directions for that location."

    # ----- BAGGAGE INFO -----
    elif intent == 'Baggage Info':
        baggage_issue = extract_param('baggage_issue')
        if baggage_issue:
            issue = baggage_issue.lower()
            synonyms = {
                'missing': ['missing', 'lost'],
                'claim': ['claim', 'lost luggage'],
                'carry': ['carry', 'weight', 'kg']
            }
            mapped_issue = None
            for key, syns in synonyms.items():
                if any(word in issue for word in syns):
                    mapped_issue = key
                    break
            baggage_responses = {
                'missing': "If your baggage is missing, please report to the lost & found desk immediately.",
                'claim': "You can claim lost luggage at the lost & found area near arrivals.",
                'carry': "You can carry up to 23 kg per checked-in bag, and 7 kg for cabin luggage."
            }
            if mapped_issue:
                response_text = baggage_responses[mapped_issue]
            else:
                response_text = "Sorry, I don't have info on that baggage issue."

    # ----- TRANSPORT INFO -----
    elif intent == 'Transport Info':
        t_type = extract_param('transport_type')
        if t_type:
            transport = t_type.lower()
            synonyms = {
                'bus': ['bus', 'buses'],
                'taxi': ['taxi', 'taxi fare', 'taxi fares'],
                'shuttle': ['shuttle', 'shuttles'],
                'city_to_airport': ['city to airport', 'from city', 'city airport']
            }
            mapped_transport = None
            for key, syns in synonyms.items():
                if any(word in transport for word in syns):
                    mapped_transport = key
                    break
            transport_responses = {
                'bus': "Buses leave from the airport every 30 minutes to the city center.",
                'taxi': "Taxi fares from Entebbe Airport start at $15 to the city center.",
                'shuttle': "Yes, there are shuttle services that operate between the airport and major hotels.",
                'city_to_airport': "You can take a taxi, shuttle, or bus from the city to the airport."
            }
            if mapped_transport:
                response_text = transport_responses[mapped_transport]
            else:
                response_text = "Sorry, I don't have info on that transport option."

    return jsonify({
        'fulfillmentText': response_text,
        'intent': intent
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
