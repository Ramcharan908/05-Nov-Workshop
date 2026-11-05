import os
from flask import Flask, jsonify, request
from supabase import create_client, Client
from postgrest import APIError
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_PUBLISHABLE_KEY")
)
print("Created")


@app.get('/health')
def health():
    return jsonify(status='ok'), 200


def _authenticated_user():
    authorization = request.headers.get("Authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None, None

    try:
        user = supabase.auth.get_user(token).user
    except Exception:
        return None, None

    user_client = create_client(
        os.environ.get("SUPABASE_URL"),
        os.environ.get("SUPABASE_PUBLISHABLE_KEY")
    )
    user_client.postgrest.auth(token)
    return user, user_client


@app.route('/')
def index():
    try:
        response = supabase.table('users').select("*").execute()
    except APIError as error:
        return f'<p>Error loading users: {error.message}</p>'

    users = response.data

    html = '<h1>users</h1><ul>'
    for user in users:
        html += f'<li>{user["email"]}</li>'
    html += '</ul>'

    return html


@app.get('/api/events')
def list_events():
    try:
        response = supabase.table('events').select('*').execute()
    except APIError:
        return jsonify(error='Unable to load events.'), 500

    return jsonify(response.data), 200


@app.get('/api/events/<event_id>')
def get_event(event_id):
    try:
        response = supabase.table('events').select('*').eq('id', event_id).execute()
    except APIError:
        return jsonify(error='Unable to load event.'), 500

    if not response.data:
        return jsonify(error='Event not found.'), 404
    return jsonify(response.data[0]), 200


@app.post('/api/registrations')
def create_registration():
    user, user_client = _authenticated_user()
    if user is None:
        return jsonify(error='Authentication required.'), 401

    body = request.get_json(silent=True) or {}
    event_id = body.get('event_id')
    if not event_id:
        return jsonify(error='event_id is required.'), 400

    try:
        response = user_client.table('registrations').insert({
            'event_id': event_id,
            'user_id': user.id,
        }).execute()
    except APIError as error:
        if getattr(error, 'code', None) == '23505':
            return jsonify(error='You are already registered for this event.'), 409
        return jsonify(error='Unable to create registration.'), 500

    registration = response.data[0] if response.data else {}
    return jsonify(registration), 201


@app.get('/api/me/registrations')
def list_my_registrations():
    user, user_client = _authenticated_user()
    if user is None:
        return jsonify(error='Authentication required.'), 401

    try:
        response = user_client.table('registrations').select('*').eq('user_id', user.id).execute()
    except APIError:
        return jsonify(error='Unable to load registrations.'), 500

    return jsonify(response.data), 200


@app.get('/api/events/<event_id>/registrations')
def list_event_registrations(event_id):
    user, user_client = _authenticated_user()
    if user is None:
        return jsonify(error='Authentication required.'), 401

    try:
        event_response = user_client.table('events').select('organizer_id').eq('id', event_id).execute()
    except APIError:
        return jsonify(error='Unable to load event.'), 500

    if not event_response.data:
        return jsonify(error='Event not found.'), 404
    if event_response.data[0].get('organizer_id') != user.id:
        return jsonify(error='Only the event organizer can view its attendees.'), 403

    try:
        response = user_client.table('registrations').select('*').eq('event_id', event_id).execute()
    except APIError:
        return jsonify(error='Unable to load attendees.'), 500

    return jsonify(response.data), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)