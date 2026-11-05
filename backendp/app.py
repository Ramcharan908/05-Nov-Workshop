import os
from pathlib import Path
from datetime import datetime, timezone
from flask import Flask, jsonify, redirect, request, send_from_directory
from supabase import create_client, Client
from postgrest import APIError
from dotenv import load_dotenv

load_dotenv(Path(__file__).with_name('.env'))

app = Flask(__name__)
DESIGN_DIR = Path(__file__).resolve().parent.parent / 'design'

supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_PUBLISHABLE_KEY")
)
print("Created")


@app.after_request
def add_api_cors_headers(response):
    if request.path.startswith('/api/'):
        origin = request.headers.get('Origin')
        allowed_origins = [
            value.strip()
            for value in os.environ.get('CORS_ALLOWED_ORIGINS', '*').split(',')
            if value.strip()
        ]
        if not allowed_origins:
            allowed_origins = ['*']
        if origin and ('*' in allowed_origins or origin in allowed_origins):
            response.headers['Access-Control-Allow-Origin'] = '*' if '*' in allowed_origins else origin
            response.headers['Vary'] = 'Origin'
        response.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, apikey'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, DELETE, OPTIONS'
        response.headers['Access-Control-Max-Age'] = '600'
    return response


@app.before_request
def handle_api_preflight():
    if request.path.startswith('/api/') and request.method == 'OPTIONS':
        return '', 204


@app.get('/health')
def health():
    return jsonify(status='ok'), 200


@app.get('/api/users')
def list_users():
    try:
        response = supabase.table('users').select('id, email, role').execute()
    except APIError:
        return jsonify(error='Unable to load users.'), 500
    return jsonify(response.data), 200


@app.route('/')
def index():
    return redirect('/design/')


@app.get('/design/')
def design_index():
    return send_from_directory(DESIGN_DIR, 'index.html')


@app.get('/design/<path:asset_path>')
def design_asset(asset_path):
    return send_from_directory(DESIGN_DIR, asset_path)


@app.get('/api/events')
def list_events():
    try:
        response = supabase.table('events').select('*').execute()
    except APIError:
        return jsonify(error='Unable to load events.'), 500

    return jsonify(response.data), 200


@app.post('/api/events')
def create_event():
    body = request.get_json(silent=True) or {}
    title = str(body.get('title', '')).strip()
    organiser_id = body.get('organiser_id')
    try:
        capacity = int(body.get('capacity'))
    except (TypeError, ValueError):
        return jsonify(error='capacity must be a whole number.'), 400

    if not title or len(title) > 200:
        return jsonify(error='title is required and must be 200 characters or fewer.'), 400
    if capacity < 1 or capacity > 5000:
        return jsonify(error='capacity must be between 1 and 5000.'), 400
    if not organiser_id:
        return jsonify(error='organiser_id is required.'), 400

    try:
        response = supabase.table('events').insert({
            'title': title,
            'capacity': capacity,
            'organiser_id': organiser_id,
        }).execute()
    except APIError:
        return jsonify(error='Unable to create event.'), 500
    event = response.data[0] if response.data else {}
    return jsonify(event), 201


@app.get('/api/events/<event_id>')
def get_event(event_id):
    try:
        response = supabase.table('events').select('*').eq('id', event_id).execute()
    except APIError:
        return jsonify(error='Unable to load event.'), 500

    if not response.data:
        return jsonify(error='Event not found.'), 404
    return jsonify(response.data[0]), 200


@app.delete('/api/events/<event_id>')
def delete_event(event_id):
    try:
        response = supabase.table('events').delete().eq('id', event_id).execute()
    except APIError:
        return jsonify(error='Unable to delete event.'), 500
    if not response.data:
        return jsonify(error='Event not found.'), 404
    return jsonify(message='Event deleted.'), 200


@app.post('/api/registrations')
def create_registration():
    body = request.get_json(silent=True) or {}
    event_id = body.get('event_id')
    user_id = body.get('user_id')
    if not event_id or not user_id:
        return jsonify(error='event_id and user_id are required.'), 400

    try:
        response = supabase.table('registrations').insert({
            'event_id': event_id,
            'user_id': user_id,
            'time': datetime.now(timezone.utc).isoformat(),
        }).execute()
    except APIError as error:
        if getattr(error, 'code', None) == '23505':
            return jsonify(error='You are already registered for this event.'), 409
        return jsonify(error='Unable to create registration.'), 500

    registration = response.data[0] if response.data else {}
    return jsonify(registration), 201


@app.get('/api/registrations')
def list_registrations():
    user_id = request.args.get('user_id')
    try:
        query = supabase.table('registrations').select('*')
        if user_id:
            query = query.eq('user_id', user_id)
        response = query.execute()
    except APIError:
        return jsonify(error='Unable to load registrations.'), 500
    return jsonify(response.data), 200


@app.get('/api/me/registrations')
def list_current_user_registrations():
    # This app uses a client-selected demo user, not an authenticated session.
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify(error='user_id is required.'), 400
    try:
        response = supabase.table('registrations').select('*').eq('user_id', user_id).execute()
    except APIError:
        return jsonify(error='Unable to load registrations.'), 500
    return jsonify(response.data), 200


@app.delete('/api/registrations/<registration_id>')
def delete_registration(registration_id):
    try:
        response = supabase.table('registrations').delete().eq('id', registration_id).execute()
    except APIError:
        return jsonify(error='Unable to delete registration.'), 500
    if not response.data:
        return jsonify(error='Registration not found.'), 404
    return jsonify(message='Registration deleted.'), 200


@app.get('/api/events/<event_id>/registrations')
def list_event_registrations(event_id):
    try:
        event_response = supabase.table('events').select('id').eq('id', event_id).execute()
    except APIError:
        return jsonify(error='Unable to load event.'), 500

    if not event_response.data:
        return jsonify(error='Event not found.'), 404

    try:
        response = supabase.table('registrations').select('*').eq('event_id', event_id).execute()
    except APIError:
        return jsonify(error='Unable to load attendees.'), 500

    return jsonify(response.data), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)
