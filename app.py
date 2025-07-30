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
        # Store onboarding answers in session
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
    """Process career quiz results"""
    if request.json:
        answers = request.json.get('answers', {})
    else:
        answers = {}
    content = load_json_file('content.json')
    careers = content.get('careers', {})
    
    # Simple career matching algorithm
    career_scores = {}
    for career_id, career_data in careers.items():
        score = 0
        matching_answers = career_data.get('matching_answers', {})
        for answer_key, answer_value in answers.items():
            if answer_key in matching_answers:
                if answer_value in matching_answers[answer_key]:
                    score += matching_answers[answer_key][answer_value]
        career_scores[career_id] = score
    
    # Get top 3 matches
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
    """Weekly timetable builder"""
    return render_template('timetable.html')

@app.route('/dashboard')
def dashboard():
    """Progress dashboard"""
    # Get user progress data from session
    progress_data = {
        'onboarding': 100 if session.get('onboarding_complete') else 0,
        'career': session.get('career_progress', 0),
        'timetable': session.get('timetable_progress', 0),
        'overall': session.get('overall_progress', 0)
    }
    
    return render_template('dashboard.html', progress=progress_data)

@app.route('/settings')
def settings():
    """Settings page"""
    content = load_json_file('content.json')
    return render_template('settings.html', content=content)

@app.route('/settings/update', methods=['POST'])
def update_settings():
    """Update user settings"""
    settings_data = request.json or {}
    for key, value in settings_data.items():
        session[key] = value
    return jsonify({'success': True})

@app.route('/settings/content', methods=['POST'])
def update_content():
    """Update content JSON through embedded editor"""
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
    """Feedback page"""
    if request.method == 'POST':
        feedback_data = {
            'timestamp': datetime.now().isoformat(),
            'rating': request.form.get('rating'),
            'feedback_text': request.form.get('feedback_text'),
            'user_name': session.get('user_name', 'Anonymous'),
            'helpful_features': request.form.get('helpful_features', ''),
            'recommendation': request.form.get('recommendation', '')
        }
        
        # Load existing feedback
        existing_feedback = load_json_file('feedback.json')
        if 'feedback' not in existing_feedback:
            existing_feedback['feedback'] = []
        
        # Append new feedback
        existing_feedback['feedback'].append(feedback_data)
        
        # Save feedback
        if save_json_file('feedback.json', existing_feedback):
            flash('Thank you for your feedback! Your response has been recorded.', 'success')
            return redirect(url_for('feedback'))
        else:
            flash('There was an error saving your feedback. Please try again.', 'error')
    
    # Get actual feedback stats
    feedback_data = load_json_file('feedback.json')
    feedback_list = feedback_data.get('feedback', [])
    
    # Calculate real stats
    total_feedback = len(feedback_list)
    if total_feedback > 0:
        ratings = [int(f.get('rating', 0)) for f in feedback_list if f.get('rating') and str(f.get('rating')).isdigit()]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        avg_rating = round(avg_rating, 1)
    else:
        avg_rating = 0.0
    
    stats = {
        'total_users': max(total_feedback, 0),  # Real count
        'average_rating': avg_rating,
        'total_feedback': total_feedback
    }
    
    return render_template('feedback.html', stats=stats)

@app.route('/download/<data_type>')
def download_data(data_type):
    """Download user data"""
    if data_type == 'analytics':
        # Create analytics ZIP
        memory_file = io.BytesIO()
        with zipfile.ZipFile(memory_file, 'w') as zf:
            # Add session data
            session_data = dict(session)
            zf.writestr('session_data.json', json.dumps(session_data, indent=2))
            
            # Add feedback if exists
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
    
    elif data_type == 'career_results':
        career_results = session.get('career_results', {})
        return jsonify(career_results)
    
    elif data_type == 'timetable':
        timetable_data = session.get('timetable_data', {})
        return jsonify(timetable_data)
    
    return jsonify({'error': 'Invalid data type'})

@app.route('/api/progress', methods=['POST'])
def update_progress():
    """Update user progress"""
    progress_data = request.json or {}
    for key, value in progress_data.items():
        session[f'{key}_progress'] = value
    
    # Calculate overall progress
    total_sections = 4
    completed = sum([
        1 if session.get('onboarding_complete') else 0,
        1 if session.get('career_progress', 0) > 80 else 0,
        1 if session.get('timetable_progress', 0) > 50 else 0,
        1 if session.get('dashboard_visited') else 0
    ])
    session['overall_progress'] = (completed / total_sections) * 100
    
    return jsonify({'success': True})

if __name__ == '__main__':
    # Ensure data files exist
    if not os.path.exists('content.json'):
        # Create initial content with sample data
        initial_content = {
            "career_questions": [
                {
                    "id": "q1",
                    "question": "What type of work environment appeals to you most?",
                    "type": "multiple_choice",
                    "options": [
                        {"value": "office", "text": "Traditional office setting"},
                        {"value": "remote", "text": "Remote/work from home"},
                        {"value": "outdoors", "text": "Outdoor environments"},
                        {"value": "lab", "text": "Laboratory or research facility"},
                        {"value": "creative", "text": "Creative studio or workshop"}
                    ]
                },
                {
                    "id": "q2",
                    "question": "Which activities do you find most engaging?",
                    "type": "multiple_choice",
                    "options": [
                        {"value": "problem_solving", "text": "Solving complex problems"},
                        {"value": "helping_people", "text": "Helping and supporting others"},
                        {"value": "creating", "text": "Creating and designing things"},
                        {"value": "analyzing", "text": "Analyzing data and patterns"},
                        {"value": "leading", "text": "Leading teams and projects"}
                    ]
                }
            ],
            "careers": {
                "software_engineer": {
                    "title": "Software Engineer",
                    "description": "Design, develop, and maintain software applications and systems",
                    "growth_outlook": "Excellent",
                    "average_salary": "$85,000 - $150,000",
                    "required_skills": ["Programming", "Problem-solving", "Logical thinking"],
                    "matching_answers": {
                        "q1": {"office": 3, "remote": 3, "lab": 2},
                        "q2": {"problem_solving": 4, "creating": 3, "analyzing": 3}
                    }
                }
            }
        }
        save_json_file('content.json', initial_content)
    
    if not os.path.exists('feedback.json'):
        save_json_file('feedback.json', {'feedback': []})
    
    app.run(host='0.0.0.0', port=5000, debug=True)