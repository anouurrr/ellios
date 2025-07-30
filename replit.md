# Elios – Your Inner Compass

## Overview

Elios is a comprehensive Flask-based web application designed to guide students through career exploration, schedule planning, and personal growth tracking. The application provides an elegant, interactive experience with offline capabilities using localStorage and Flask JSON files for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Template Engine**: Jinja2 templates with Bootstrap 5 for responsive design
- **Styling**: Custom CSS with CSS variables for theme management, Google Fonts (Poppins), Font Awesome icons
- **JavaScript**: Vanilla JavaScript for interactivity, Chart.js for data visualization
- **Responsive Design**: Mobile-first approach with Bootstrap grid system

### Backend Architecture
- **Framework**: Flask (Python) with session-based state management
- **Data Storage**: JSON files for content and feedback storage, localStorage for client-side persistence
- **File Structure**: Modular template inheritance using base.html
- **Session Management**: Flask sessions for user state across requests

### Key Components

#### 1. Onboarding System (`/begin`)
- 6-step interactive questionnaire
- Session storage for user preferences
- Progressive form validation
- Redirect flow to main dashboard

#### 2. Home Dashboard (`/`)
- Animated compass logo with personalized greeting
- Six interactive feature cards with hover effects
- Session-based user name and goal display
- Progress-based navigation system

#### 3. Career Assessment (`/career`)
- Dynamic questionnaire system using content.json
- Branching logic for personalized career recommendations
- Progress tracking with visual indicators
- JSON export functionality for results

#### 4. Timetable Builder (`/timetable`)
- Drag-and-drop weekly planner (Monday-Sunday, 8AM-10PM)
- Predefined activity blocks with color coding
- Real-time summary calculations
- localStorage persistence and JSON export

#### 5. Analytics Dashboard (`/dashboard`)
- Chart.js integration for progress visualization
- Mood tracking and time distribution analysis
- Achievement system with progress badges
- Data export capabilities

#### 6. Settings Management (`/settings`)
- Theme customization (dark mode, color schemes)
- Text size and language preferences
- Notification management
- Embedded JSON content editor
- Data import/export functionality

#### 7. Feedback System (`/feedback`)
- Star rating system
- Text feedback collection
- JSON file persistence (feedback.json)

## Data Flow

### Client-Side Data Flow
1. User interactions trigger JavaScript event handlers
2. Form data captured and validated on client-side
3. localStorage used for offline persistence
4. AJAX calls made to Flask endpoints for server-side processing

### Server-Side Data Flow
1. Flask routes handle HTTP requests
2. Session data maintained across requests
3. JSON files read/written for persistent storage
4. Template rendering with dynamic data injection

### Data Persistence Strategy
- **Session Data**: User preferences, onboarding responses
- **localStorage**: Settings, timetables, temporary progress data
- **JSON Files**: Career questions (content.json), feedback (feedback.json)
- **File Downloads**: JSON exports for user data portability

## External Dependencies

### Frontend Libraries
- **Bootstrap 5.3.0**: Responsive UI framework
- **Font Awesome 6.4.0**: Icon library
- **Google Fonts**: Poppins font family
- **Chart.js**: Data visualization library

### Backend Libraries
- **Flask**: Web framework
- **Python Standard Library**: json, datetime, logging, os, io, zipfile

### Development Dependencies
- No external database required (file-based storage)
- No external APIs or services
- Fully offline-capable design

## Deployment Strategy

### Local Development
- **Entry Point**: main.py runs Flask development server
- **Host Configuration**: 0.0.0.0:5000 for accessibility
- **Debug Mode**: Enabled for development
- **Session Secret**: Environment variable with fallback

### Production Considerations
- Environment-based configuration for session secrets
- Static file serving optimization
- JSON file backup and recovery mechanisms
- Error logging and monitoring setup

### File Structure Requirements
- Templates directory with base.html inheritance
- Static assets (CSS, JS) organization
- JSON data files in root directory
- Proper file permissions for JSON write operations

## Key Technical Decisions

### 1. File-Based Storage vs Database
- **Chosen**: JSON files for simplicity and offline capability
- **Rationale**: Reduces deployment complexity, enables easy data portability
- **Trade-offs**: Limited concurrent user support, manual data management

### 2. Client-Side State Management
- **Chosen**: localStorage + Flask sessions hybrid approach
- **Rationale**: Offline functionality while maintaining server-side session security
- **Benefits**: Fast user experience, data persistence across browser sessions

### 3. Template Architecture
- **Chosen**: Jinja2 with base template inheritance
- **Rationale**: Consistent UI/UX, maintainable code structure
- **Implementation**: Modular components with block-based content injection

### 4. Progressive Enhancement
- **Chosen**: JavaScript enhancement over server-side rendering
- **Rationale**: Better user experience while maintaining functionality without JS
- **Implementation**: Form submissions work with and without JavaScript