import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='public', static_url_path='')
CORS(app)  # Enable Cross-Origin Resource Sharing

DB_FILE = os.path.join(os.path.dirname(__file__), 'db.json')

# Helper function to read DB
def read_db():
    if not os.path.exists(DB_FILE):
        return {"users": [], "projects": [], "tasks": [], "messages": []}
    with open(DB_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

# Helper function to write DB
def write_db(data):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# Root route - serve the index.html from public
@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

# Serve static files inside public (for modular JS/CSS files)
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('public', path)

# API - Get all data (bootstrapping)
@app.route('/api/data', methods=['GET'])
def get_all_data():
    return jsonify(read_db())

# API - Create a new project
@app.route('/api/projects', methods=['POST'])
def create_project():
    data = read_db()
    project = request.json
    if not project or 'name' not in project:
        return jsonify({"error": "Missing project name"}), 400
    
    project['id'] = f"p{len(data['projects']) + 1}"
    data['projects'].append(project)
    write_db(data)
    return jsonify(project), 201

# API - Create a new task
@app.route('/api/tasks', methods=['POST'])
def create_task():
    data = read_db()
    task = request.json
    if not task or 'title' not in task or 'projectId' not in task:
        return jsonify({"error": "Missing task title or projectId"}), 400
    
    # Generate unique ID
    task_id = f"t{len(data['tasks']) + 100}" # start from t100 to avoid duplicates
    task['id'] = task_id
    task.setdefault('status', 'todo')
    task.setdefault('priority', 'medium')
    task.setdefault('dueDate', '')
    task.setdefault('assigneeId', 'u1')
    task.setdefault('description', '')
    task.setdefault('subtasks', [])
    task.setdefault('comments', [])
    task.setdefault('attachments', [])
    
    data['tasks'].append(task)
    write_db(data)
    return jsonify(task), 201

# API - Update a task
@app.route('/api/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    data = read_db()
    task_updates = request.json
    if not task_updates:
        return jsonify({"error": "No updates provided"}), 400
    
    task_found = None
    for task in data['tasks']:
        if task['id'] == task_id:
            # Update values
            for key, val in task_updates.items():
                if key != 'id':  # Prevent changing ID
                    task[key] = val
            task_found = task
            break
            
    if not task_found:
        return jsonify({"error": "Task not found"}), 404
        
    write_db(data)
    return jsonify(task_found)

# API - Delete a task
@app.route('/api/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    data = read_db()
    original_len = len(data['tasks'])
    data['tasks'] = [t for t in data['tasks'] if t['id'] != task_id]
    
    if len(data['tasks']) == original_len:
        return jsonify({"error": "Task not found"}), 404
        
    write_db(data)
    return jsonify({"success": True})

# API - Add comment to a task
@app.route('/api/tasks/<task_id>/comments', methods=['POST'])
def add_comment(task_id):
    data = read_db()
    comment = request.json
    if not comment or 'text' not in comment or 'userId' not in comment:
        return jsonify({"error": "Invalid comment payload"}), 400
    
    task_found = None
    for task in data['tasks']:
        if task['id'] == task_id:
            comment['id'] = f"c{len(task.get('comments', [])) + 1}"
            comment.setdefault('timestamp', '')
            task.setdefault('comments', []).append(comment)
            task_found = task
            break
            
    if not task_found:
        return jsonify({"error": "Task not found"}), 404
        
    write_db(data)
    return jsonify(comment), 201

# API - Add attachment to a task
@app.route('/api/tasks/<task_id>/attachments', methods=['POST'])
def add_attachment(task_id):
    data = read_db()
    attachment = request.json
    if not attachment or 'name' not in attachment:
        return jsonify({"error": "Invalid attachment payload"}), 400
    
    task_found = None
    for task in data['tasks']:
        if task['id'] == task_id:
            attachment['id'] = f"a{len(task.get('attachments', [])) + 1}"
            task.setdefault('attachments', []).append(attachment)
            task_found = task
            break
            
    if not task_found:
        return jsonify({"error": "Task not found"}), 404
        
    write_db(data)
    return jsonify(attachment), 201

# API - Post a chat message
@app.route('/api/messages', methods=['POST'])
def post_message():
    data = read_db()
    msg = request.json
    if not msg or 'text' not in msg or 'userId' not in msg or 'projectId' not in msg:
        return jsonify({"error": "Invalid message payload"}), 400
        
    msg['id'] = f"m{len(data['messages']) + 1}"
    msg.setdefault('timestamp', '')
    data['messages'].append(msg)
    write_db(data)
    return jsonify(msg), 201

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"ProjectPulse Flask API server starting on port {port}...")
    app.run(host="0.0.0.0", port=port)

