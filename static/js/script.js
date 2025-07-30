/**
 * Elios - Your Inner Compass
 * Main JavaScript functionality for interactivity and localStorage management
 */

// Global application state
const EliosApp = {
    version: '1.0.0',
    initialized: false,
    currentUser: null,
    settings: {
        darkMode: false,
        textSize: 'medium',
        colorScheme: 'default',
        language: 'en',
        notifications: {
            enabled: true,
            scheduleReminders: true,
            progressUpdates: false,
            frequency: 'daily'
        }
    },
    
    // Initialize the application
    init() {
        if (this.initialized) return;
        
        console.log(`🧭 Elios v${this.version} - Your Inner Compass`);
        
        this.loadSettings();
        this.setupEventListeners();
        this.initializeAnimations();
        this.checkFirstVisit();
        this.updateProgress();
        
        this.initialized = true;
        console.log('✅ Elios initialized successfully');
    },
    
    // Load user settings from localStorage
    loadSettings() {
        try {
            // Load individual settings
            this.settings.darkMode = localStorage.getItem('elios_dark_mode') === 'true';
            this.settings.textSize = localStorage.getItem('elios_text_size') || 'medium';
            this.settings.colorScheme = localStorage.getItem('elios_color_scheme') || 'default';
            this.settings.language = localStorage.getItem('elios_language') || 'en';
            
            // Load notification settings
            const savedNotifications = localStorage.getItem('elios_notifications');
            if (savedNotifications) {
                this.settings.notifications = { ...this.settings.notifications, ...JSON.parse(savedNotifications) };
            }
            
            // Apply settings to DOM
            this.applySettings();
            
        } catch (error) {
            console.warn('Error loading settings:', error);
        }
    },
    
    // Apply settings to the DOM
    applySettings() {
        const body = document.body;
        
        // Apply dark mode
        if (this.settings.darkMode) {
            body.classList.add('dark-theme');
        }
        
        // Apply text size
        body.classList.add(`text-size-${this.settings.textSize}`);
        
        // Apply color scheme
        body.classList.add(`color-scheme-${this.settings.colorScheme}`);
        
        // Set language attribute
        document.documentElement.lang = this.settings.language;
    },
    
    // Save settings to localStorage
    saveSettings() {
        try {
            localStorage.setItem('elios_dark_mode', this.settings.darkMode);
            localStorage.setItem('elios_text_size', this.settings.textSize);
            localStorage.setItem('elios_color_scheme', this.settings.colorScheme);
            localStorage.setItem('elios_language', this.settings.language);
            localStorage.setItem('elios_notifications', JSON.stringify(this.settings.notifications));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    },
    
    // Setup global event listeners
    setupEventListeners() {
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
        
        // Handle form submissions with loading states
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
        });
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.updateProgress();
            }
        });
        
        // Handle before unload for data safety
        window.addEventListener('beforeunload', (e) => {
            this.saveSettings();
            // Only show warning if user has unsaved changes
            const hasUnsavedChanges = this.checkUnsavedChanges();
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
        
        // Handle resize events for responsive adjustments
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
        
        // Handle keyboard navigation
        document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
    },
    
    // Initialize animations
    initializeAnimations() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Observe elements that should animate in
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
        
        // Add stagger animation to card grids
        this.staggerAnimateElements('.nav-card', 100);
        this.staggerAnimateElements('.feature-item', 150);
    },
    
    // Stagger animate elements
    staggerAnimateElements(selector, delay) {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('fade-in');
            }, index * delay);
        });
    },
    
    // Check if this is the first visit
    checkFirstVisit() {
        const hasVisited = localStorage.getItem('elios_has_visited');
        if (!hasVisited) {
            localStorage.setItem('elios_has_visited', 'true');
            this.showWelcomeMessage();
        }
    },
    
    // Show welcome message for first-time visitors
    showWelcomeMessage() {
        // Check if we're not on the begin page
        if (!window.location.pathname.includes('/begin')) {
            this.showNotification('Welcome to Elios! 🧭', 'Your journey to self-discovery starts here.', 'success', 5000);
        }
    },
    
    // Update user progress
    updateProgress() {
        const progressData = {
            timestamp: new Date().toISOString(),
            currentPage: window.location.pathname,
            sessionDuration: this.getSessionDuration()
        };
        
        // Save progress data
        localStorage.setItem('elios_last_activity', JSON.stringify(progressData));
        
        // Send to server if available
        this.sendProgressUpdate(progressData);
    },
    
    // Send progress update to server
    async sendProgressUpdate(data) {
        try {
            const response = await fetch('/api/progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error('Failed to update progress');
            }
        } catch (error) {
            console.warn('Could not update server progress:', error);
        }
    },
    
    // Get session duration
    getSessionDuration() {
        const sessionStart = localStorage.getItem('elios_session_start');
        if (!sessionStart) {
            const now = Date.now();
            localStorage.setItem('elios_session_start', now.toString());
            return 0;
        }
        return Date.now() - parseInt(sessionStart);
    },
    
    // Handle form submissions
    handleFormSubmit(e) {
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        if (submitBtn) {
            // Add loading state
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
            submitBtn.disabled = true;
            
            // Remove loading state after a delay (let the form submit naturally)
            setTimeout(() => {
                if (submitBtn) {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            }, 3000);
        }
    },
    
    // Handle keyboard navigation
    handleKeyboardNavigation(e) {
        // Escape key handling
        if (e.key === 'Escape') {
            this.closeModals();
        }
        
        // Alt + number shortcuts for navigation
        if (e.altKey && !isNaN(e.key)) {
            const shortcuts = {
                '1': '/',           // Home
                '2': '/career',     // Career
                '3': '/timetable',  // Timetable
                '4': '/dashboard',  // Dashboard
                '5': '/settings',   // Settings
                '6': '/feedback'    // Feedback
            };
            
            if (shortcuts[e.key]) {
                e.preventDefault();
                window.location.href = shortcuts[e.key];
            }
        }
    },
    
    // Handle window resize
    handleResize() {
        // Recalculate layouts if needed
        this.updateMobileLayout();
    },
    
    // Update mobile layout adjustments
    updateMobileLayout() {
        const isMobile = window.innerWidth <= 768;
        document.body.classList.toggle('mobile-layout', isMobile);
    },
    
    // Check for unsaved changes
    checkUnsavedChanges() {
        // Check if current page has unsaved form data
        const forms = document.querySelectorAll('form');
        for (let form of forms) {
            const formData = new FormData(form);
            for (let [key, value] of formData.entries()) {
                if (value && value.toString().trim()) {
                    return true;
                }
            }
        }
        return false;
    },
    
    // Close all modals
    closeModals() {
        document.querySelectorAll('.modal.show').forEach(modal => {
            const bootstrapModal = bootstrap.Modal.getInstance(modal);
            if (bootstrapModal) {
                bootstrapModal.hide();
            }
        });
    },
    
    // Show notification
    showNotification(title, message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show notification-toast`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
            min-width: 300px;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        `;
        
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${this.getNotificationIcon(type)} me-2"></i>
                <div>
                    <strong>${title}</strong><br>
                    <small>${message}</small>
                </div>
                <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    },
    
    // Get notification icon based on type
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[type] || 'bell';
    },
    
    // Debounce utility function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Local storage management
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(`elios_${key}`, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Storage set error:', error);
                return false;
            }
        },
        
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(`elios_${key}`);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Storage get error:', error);
                return defaultValue;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(`elios_${key}`);
                return true;
            } catch (error) {
                console.error('Storage remove error:', error);
                return false;
            }
        },
        
        clear() {
            try {
                Object.keys(localStorage)
                    .filter(key => key.startsWith('elios_'))
                    .forEach(key => localStorage.removeItem(key));
                return true;
            } catch (error) {
                console.error('Storage clear error:', error);
                return false;
            }
        }
    },
    
    // Theme management
    theme: {
        toggle() {
            EliosApp.settings.darkMode = !EliosApp.settings.darkMode;
            document.body.classList.toggle('dark-theme', EliosApp.settings.darkMode);
            EliosApp.saveSettings();
        },
        
        setColorScheme(scheme) {
            // Remove existing color schemes
            document.body.classList.remove('color-scheme-default', 'color-scheme-teal', 'color-scheme-purple');
            // Add new color scheme
            document.body.classList.add(`color-scheme-${scheme}`);
            EliosApp.settings.colorScheme = scheme;
            EliosApp.saveSettings();
        },
        
        setTextSize(size) {
            // Remove existing text sizes
            document.body.classList.remove('text-size-small', 'text-size-medium', 'text-size-large', 'text-size-extra-large');
            // Add new text size
            document.body.classList.add(`text-size-${size}`);
            EliosApp.settings.textSize = size;  
            EliosApp.saveSettings();
        }
    },
    
    // Analytics and tracking
    analytics: {
        track(event, data = {}) {
            const analyticsData = {
                event,
                data,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent
            };
            
            // Store locally
            const events = EliosApp.storage.get('analytics_events', []);
            events.push(analyticsData);
            
            // Keep only last 100 events
            if (events.length > 100) {
                events.splice(0, events.length - 100);
            }
            
            EliosApp.storage.set('analytics_events', events);
            
            console.log('📊 Analytics:', event, data);
        },
        
        getEvents() {
            return EliosApp.storage.get('analytics_events', []);
        },
        
        clearEvents() {
            EliosApp.storage.remove('analytics_events');
        }
    }
};

// Page-specific functionality
const PageHandlers = {
    // Home page
    home() {
        // Animate compass on home page
        const compass = document.querySelector('.rotating-compass');
        if (compass) {
            compass.addEventListener('click', () => {
                compass.style.animation = 'none';
                setTimeout(() => {
                    compass.style.animation = 'rotate 2s linear infinite';
                }, 10);
            });
        }
        
        // Track feature card interactions
        document.querySelectorAll('.nav-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const feature = card.href.split('/').pop() || 'home';
                EliosApp.analytics.track('feature_accessed', { feature });
            });
        });
    },
    
    // Career page
    career() {
        EliosApp.analytics.track('career_quiz_started');
    },
    
    // Timetable page
    timetable() {
        EliosApp.analytics.track('timetable_accessed');
        
        // Save timetable data on changes
        const saveTimetable = EliosApp.debounce(() => {
            EliosApp.analytics.track('timetable_updated');
        }, 1000);
        
        // Watch for timetable changes
        const observer = new MutationObserver(saveTimetable);
        const timetableContainer = document.querySelector('.timetable-container');
        if (timetableContainer) {
            observer.observe(timetableContainer, { 
                childList: true, 
                subtree: true, 
                attributes: true 
            });
        }
    },
    
    // Dashboard page
    dashboard() {
        EliosApp.analytics.track('dashboard_viewed');
        
        // Add chart interactions
        setTimeout(() => {
            const charts = document.querySelectorAll('canvas');
            charts.forEach(chart => {
                chart.addEventListener('click', () => {
                    EliosApp.analytics.track('chart_interaction', { 
                        chartId: chart.id 
                    });
                });
            });
        }, 1000);
    },
    
    // Settings page
    settings() {
        EliosApp.analytics.track('settings_accessed');
    },
    
    // Feedback page
    feedback() {
        EliosApp.analytics.track('feedback_page_viewed');
        
        // Track feedback interactions
        const ratingInputs = document.querySelectorAll('input[name="rating"]');
        ratingInputs.forEach(input => {
            input.addEventListener('change', () => {
                EliosApp.analytics.track('feedback_rating_selected', { 
                    rating: input.value 
                });
            });
        });
    },
    
    // Begin/onboarding page
    begin() {
        EliosApp.analytics.track('onboarding_started');
        
        // Track onboarding progress
        const steps = document.querySelectorAll('.question-step');
        if (steps.length > 0) {
            const currentStep = document.querySelector('.question-step.active');
            if (currentStep) {
                const stepNumber = currentStep.dataset.step;
                EliosApp.analytics.track('onboarding_step_viewed', { 
                    step: stepNumber,
                    totalSteps: steps.length 
                });
            }
        }
    }
};

// Utility functions
const Utils = {
    // Format date
    formatDate(date, format = 'default') {
        const d = new Date(date);
        const formats = {
            default: d.toLocaleDateString(),
            long: d.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            short: d.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            }),
            time: d.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        };
        return formats[format] || formats.default;
    },
    
    // Generate unique ID
    generateId() {
        return 'elios_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    // Validate email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Get device info
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenWidth: screen.width,
            screenHeight: screen.height,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth
        };
    },
    
    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            EliosApp.showNotification('Copied!', 'Text copied to clipboard', 'success', 2000);
            return true;
        } catch (error) {
            console.error('Copy failed:', error);
            EliosApp.showNotification('Copy Failed', 'Could not copy to clipboard', 'error', 3000);
            return false;
        }
    },
    
    // Download JSON data
    downloadJSON(data, filename = 'elios_data.json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        EliosApp.analytics.track('data_downloaded', { filename, size: blob.size });
    },
    
    // Parse URL parameters
    getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (let [key, value] of params) {
            result[key] = value;
        }
        return result;
    }
};

// Service Worker registration for offline functionality
const ServiceWorker = {
    async register() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
                
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            EliosApp.showNotification(
                                'App Updated!', 
                                'A new version is available. Refresh to update.', 
                                'info',
                                8000
                            );
                        }
                    });
                });
                
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize main app
    EliosApp.init();
    
    // Register service worker
    ServiceWorker.register();
    
    // Run page-specific handlers
    const currentPage = window.location.pathname.split('/').pop() || 'home';
    if (PageHandlers[currentPage]) {
        PageHandlers[currentPage]();
    }
    
    // Track page view
    EliosApp.analytics.track('page_view', { 
        page: currentPage,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
    });
});

// Export for global access
window.EliosApp = EliosApp;
window.Utils = Utils;

// Console welcome message
console.log(`
🧭 Welcome to Elios - Your Inner Compass!

Available commands:
- EliosApp.theme.toggle() - Toggle dark mode
- EliosApp.storage.clear() - Clear all data
- EliosApp.analytics.getEvents() - View analytics
- Utils.downloadJSON(data, 'filename') - Download data as JSON

Version: ${EliosApp.version}
`);
