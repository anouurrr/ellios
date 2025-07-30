# Elios – Your Inner Compass 🧭

A comprehensive Flask-based web application designed to guide students through career exploration, schedule planning, and personal growth tracking. Elios provides an elegant, interactive experience that works fully offline using localStorage and Flask JSON files.

## 🌟 Features

### 🛫 Onboarding Flow (`/begin`)
- Interactive 6-question onboarding experience
- Personal goal setting and mood tracking
- Session and localStorage data persistence
- Smooth step-by-step navigation with progress tracking

### 🏠 Home Dashboard (`/`)
- Animated compass logo with personalized greeting
- Six large interactive feature cards with hover effects
- Progress-based navigation system
- Responsive design with beautiful animations

### 💼 Career Finder (`/career`)
- 20-30 branching questions from a comprehensive question pool
- Intelligent career matching algorithm
- Top 3 career recommendations with detailed explanations
- Downloadable results in JSON format
- Progress tracking throughout the assessment

### ⏱ Timetable Builder (`/timetable`)
- Weekly drag-and-drop planner (Monday-Sunday, 8AM-10PM)
- Predefined activity blocks (Study, Class, Break, Exercise, Meal, Hobby)
- Real-time weekly summary with time allocation
- Save/load functionality with localStorage
- Export timetables as JSON
- Template loading for quick setup

### 📊 Dashboard (`/dashboard`)
- Visual progress charts using Chart.js
- Mood trend analysis and tracking
- Time distribution visualization
- Achievement system with progress badges
- Activity timeline and engagement metrics
- Downloadable analytics data

### ⚙️ Settings (`/settings`)
- Dark mode toggle with smooth transitions
- Text size customization (Small, Medium, Large, Extra Large)
- Color scheme selection (Default, Teal, Purple gradients)
- Multi-language support (English ↔ Urdu)
- Notification preferences management
- Data export/import functionality
- Embedded JSON content editor for customization
- Analytics data management

### 📩 Feedback (`/feedback`)
- Interactive 5-star rating system
- Comprehensive feedback form with validation
- Feature helpfulness tracking
- Recommendation likelihood assessment
- Persistent feedback storage in JSON
- Real-time character counting and validation

## 🎨 Design Features

- **Typography**: Google Fonts Poppins family
- **Color Palette**: Teal and violet soft gradients with customizable themes
- **Animations**: CSS animations including fade, slide, hover-lift, and rotating compass
- **Responsive Design**: Fully responsive for all device sizes
- **Accessibility**: Focus states, readable contrast, keyboard navigation
- **Dark Mode**: Complete dark theme with smooth transitions

## 🔧 Technical Stack

### Backend
- **Flask**: Lightweight Python web framework
- **Python JSON**: Built-in JSON handling for data persistence
- **Session Management**: Flask sessions for user state
- **File I/O**: Local JSON file storage for offline functionality

### Frontend
- **HTML5**: Semantic markup with accessibility features
- **Bootstrap 5**: Responsive UI framework
- **Vanilla JavaScript**: Modern ES6+ for interactivity
- **Chart.js**: Beautiful, responsive charts and visualizations
- **Font Awesome**: Comprehensive icon library
- **CSS Grid/Flexbox**: Modern layout techniques

### Data Storage
- **localStorage**: Client-side data persistence
- **JSON Files**: Server-side data storage (content.json, feedback.json)
- **Session Storage**: Temporary user state management

## 🚀 Installation & Setup

### Prerequisites
- Python 3.7+
- Modern web browser with JavaScript enabled

### Quick Start

1. **Clone/Download the application files**
   ```bash
   # Ensure all files are in your project directory
   ```

2. **Install Flask** (if not already installed)
   ```bash
   pip install flask
   ```

3. **Set Environment Variables**
   ```bash
   # For Windows
   set SESSION_SECRET=your-secret-key-here
   
   # For Linux/Mac
   export SESSION_SECRET=your-secret-key-here
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Access the application**
   - Open your browser and navigate to `http://localhost:5000`
   - For first-time users, you'll be redirected to the onboarding flow

## 📁 Project Structure

