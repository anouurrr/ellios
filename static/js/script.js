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
        this.updateMobileLayout(); // ✅ FIX ADDED

        this.initialized = true;
        console.log('✅ Elios initialized successfully');
    },

    loadSettings() {
        try {
            this.settings.darkMode = localStorage.getItem('elios_dark_mode') === 'true';
            this.settings.textSize = localStorage.getItem('elios_text_size') || 'medium';
            this.settings.colorScheme = localStorage.getItem('elios_color_scheme') || 'default';
            this.settings.language = localStorage.getItem('elios_language') || 'en';

            const savedNotifications = localStorage.getItem('elios_notifications');
            if (savedNotifications) {
                this.settings.notifications = { ...this.settings.notifications, ...JSON.parse(savedNotifications) };
            }

            this.applySettings();
        } catch (error) {
            console.warn('Error loading settings:', error);
        }
    },

    applySettings() {
        const body = document.body;

        if (this.settings.darkMode) {
            body.classList.add('dark-theme');
        }

        body.classList.add(`text-size-${this.settings.textSize}`);
        body.classList.add(`color-scheme-${this.settings.colorScheme}`);
        document.documentElement.lang = this.settings.language;
    },

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

    setupEventListeners() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) target.scrollIntoView({ behavior: 'smooth' });
            });
        });

        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') this.updateProgress();
        });

        window.addEventListener('beforeunload', (e) => {
            this.saveSettings();
            if (this.checkUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
        document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
    },

    initializeAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        });

        document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
        this.staggerAnimateElements('.nav-card', 100);
        this.staggerAnimateElements('.feature-item', 150);
    },

    staggerAnimateElements(selector, delay) {
        document.querySelectorAll(selector).forEach((el, index) => {
            setTimeout(() => el.classList.add('fade-in'), index * delay);
        });
    },

    checkFirstVisit() {
        if (!localStorage.getItem('elios_has_visited')) {
            localStorage.setItem('elios_has_visited', 'true');
            this.showWelcomeMessage();
        }
    },

    showWelcomeMessage() {
        if (!window.location.pathname.includes('/begin')) {
            this.showNotification('Welcome to Elios! 🧭', 'Your journey starts here.', 'success', 5000);
        }
    },

    updateProgress() {
        const data = {
            timestamp: new Date().toISOString(),
            currentPage: window.location.pathname,
            sessionDuration: this.getSessionDuration()
        };

        localStorage.setItem('elios_last_activity', JSON.stringify(data));
        this.sendProgressUpdate(data);
    },

    // ✅ FIXED (offline safe)
    async sendProgressUpdate(data) {
        if (!navigator.onLine) return;

        try {
            const res = await fetch('/api/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error();
        } catch {
            console.warn('Progress skipped (offline)');
        }
    },

    getSessionDuration() {
        const start = localStorage.getItem('elios_session_start');
        if (!start) {
            localStorage.setItem('elios_session_start', Date.now());
            return 0;
        }
        return Date.now() - parseInt(start);
    },

    // ✅ FIXED (form tracking)
    handleFormSubmit(e) {
        const form = e.target;
        form.dataset.submitted = 'true';

        const btn = form.querySelector('button[type="submit"]');
        if (btn) {
            const txt = btn.innerHTML;
            btn.innerHTML = 'Processing...';
            btn.disabled = true;
            setTimeout(() => {
                btn.innerHTML = txt;
                btn.disabled = false;
            }, 3000);
        }
    },

    // ✅ FIXED (better logic)
    checkUnsavedChanges() {
        for (let form of document.querySelectorAll('form')) {
            if (form.dataset.submitted === 'true') continue;
            for (let v of new FormData(form).values()) {
                if (v && v.toString().trim()) return true;
            }
        }
        return false;
    },

    // ✅ FIXED (safe bootstrap)
    closeModals() {
        if (typeof bootstrap === 'undefined') return;

        document.querySelectorAll('.modal.show').forEach(modal => {
            try {
                const m = bootstrap.Modal.getInstance(modal);
                if (m) m.hide();
            } catch {}
        });
    },

    showNotification(title, msg, type = 'info', duration = 4000) {
        const n = document.createElement('div');
        n.className = `alert alert-${type}`;
        n.style = 'position:fixed;top:20px;right:20px;z-index:9999;';
        n.innerHTML = `<strong>${title}</strong><br>${msg}`;
        document.body.appendChild(n);
        setTimeout(() => n.remove(), duration);
    },

    debounce(func, wait) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => func(...args), wait);
        };
    }
};

// Init
document.addEventListener('DOMContentLoaded', () => {
    EliosApp.init();
});
