import os
import json
import logging
from datetime import datetime
from flask import Flask, render_template, request, session, jsonify, redirect, url_for, send_file, flash
import io
import zipfile

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "elios-compass-2025")

def load_json_file(filename):
    """Load JSON data from file"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError:
        return {}

def save_json_file(filename, data):
    """Save JSON data to file"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        logging.error(f"Error saving {filename}: {e}")
        return False

@app.route('/')
def index():
    """Home page - redirect to onboarding if not complete"""
    if not session.get('onboarding_complete'):
        return redirect(url_for('begin'))
   
    user_name = session.get('user_name', 'Student')
    user_goal = session.get('user_goal', 'explore your potential')
    return render_template('index.html', user_name=user_name, user_goal=user_goal)

@app.route('/begin', methods=['GET', 'POST'])
def begin():
    """Onboarding flow with 6 questions"""
    if request.method == 'POST':
        session['user_name'] = request.form.get('name', '')
        session['why_here'] = request.form.get('why_here', '')
        session['is_student'] = request.form.get('is_student', '')
        session['feeling'] = request.form.get('feeling', '')
        session['matters_most'] = request.form.get('matters_most', '')
        session['user_goal'] = request.form.get('goal', '')
        session['onboarding_complete'] = True
       
        flash(f"Welcome to Elios, {session['user_name']}! Let's begin your journey.", 'success')
        return redirect(url_for('index'))
   
    return render_template('begin.html')

@app.route('/career')
def career():
    """Career finder page"""
    content = load_json_file('content.json')
    questions = content.get('career_questions', [])
    careers = content.get('careers', {})
    return render_template('career.html', questions=questions, careers=careers)

@app.route('/career/result', methods=['POST'])
def career_result():
    if request.json:
        answers = request.json.get('answers', {})
    else:
        answers = {}
    content = load_json_file('content.json')
    careers = content.get('careers', {})
   
    career_scores = {}
    for career_id, career_data in careers.items():
        score = 0
        matching_answers = career_data.get('matching_answers', {})
        for answer_key, answer_value in answers.items():
            if answer_key in matching_answers:
                if answer_value in matching_answers[answer_key]:
                    score += matching_answers[answer_key][answer_value]
        career_scores[career_id] = score
   
    top_matches = sorted(career_scores.items(), key=lambda x: x[1], reverse=True)[:3]
    results = []
    for career_id, score in top_matches:
        if career_id in careers:
            career_info = careers[career_id].copy()
            career_info['score'] = score
            results.append(career_info)
   
    return jsonify({'matches': results, 'answers': answers})

@app.route('/timetable')
def timetable():
    return render_template('timetable.html')

@app.route('/dashboard')
def dashboard():
    progress_data = {
        'onboarding': 100 if session.get('onboarding_complete') else 0,
        'career': session.get('career_progress', 0),
        'timetable': session.get('timetable_progress', 0),
        'overall': session.get('overall_progress', 0)
    }
    return render_template('dashboard.html', progress=progress_data)

@app.route('/settings')
def settings():
    content = load_json_file('content.json')
    return render_template('settings.html', content=content)

@app.route('/settings/update', methods=['POST'])
def update_settings():
    settings_data = request.json or {}
    for key, value in settings_data.items():
        session[key] = value
    return jsonify({'success': True})

@app.route('/settings/content', methods=['POST'])
def update_content():
    try:
        new_content = request.json
        if save_json_file('content.json', new_content):
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Failed to save content'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/feedback', methods=['GET', 'POST'])
def feedback():
    if request.method == 'POST':
        feedback_data = {
            'timestamp': datetime.now().isoformat(),
            'rating': request.form.get('rating'),
            'feedback_text': request.form.get('feedback_text'),
            'user_name': session.get('user_name', 'Anonymous'),
            'helpful_features': request.form.get('helpful_features', ''),
            'recommendation': request.form.get('recommendation', '')
        }
       
        existing_feedback = load_json_file('feedback.json')
        if 'feedback' not in existing_feedback:
            existing_feedback['feedback'] = []
        existing_feedback['feedback'].append(feedback_data)
       
        if save_json_file('feedback.json', existing_feedback):
            flash('Thank you for your feedback! Your response has been recorded.', 'success')
            return redirect(url_for('feedback'))
        else:
            flash('There was an error saving your feedback. Please try again.', 'error')
   
    feedback_data = load_json_file('feedback.json')
    feedback_list = feedback_data.get('feedback', [])
    total_feedback = len(feedback_list)
   
    if total_feedback > 0:
        ratings = [int(f.get('rating', 0)) for f in feedback_list if f.get('rating') and str(f.get('rating')).isdigit()]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        avg_rating = round(avg_rating, 1)
    else:
        avg_rating = 0.0
   
    stats = {
        'total_users': max(total_feedback, 0),
        'average_rating': avg_rating,
        'total_feedback': total_feedback
    }
   
    return render_template('feedback.html', stats=stats)

@app.route('/download/<data_type>')
def download_data(data_type):
    if data_type == 'analytics':
        memory_file = io.BytesIO()
        with zipfile.ZipFile(memory_file, 'w') as zf:
            session_data = dict(session)
            zf.writestr('session_data.json', json.dumps(session_data, indent=2))
            feedback_data = load_json_file('feedback.json')
            if feedback_data:
                zf.writestr('feedback.json', json.dumps(feedback_data, indent=2))
        memory_file.seek(0)
        return send_file(
            memory_file,
            mimetype='application/zip',
            as_attachment=True,
            download_name='elios_analytics.zip'
        )
    return jsonify({'error': 'Invalid data type'})

if __name__ == '__main__':
    if not os.path.exists('content.json'):
        initial_content = {
            "career_questions": [ ... ],   # your original sample data
            "careers": { ... }
        }
        save_json_file('content.json', initial_content)
   
    if not os.path.exists('feedback.json'):
        save_json_file('feedback.json', {'feedback': []})
   
    app.run(host='0.0.0.0', port=5000, debug=True)
