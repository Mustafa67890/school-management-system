// Global Theme Manager - Manages themes across all modules
class GlobalThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.settings = {
            theme: 'light',
            fontSize: 'medium',
            sidebarPosition: 'left',
            defaultLanguage: 'en',
            currency: 'TZS',
            dateFormat: 'DD/MM/YYYY',
            autoSave: true,
            emailNotifications: true,
            pushNotifications: false,
            soundNotifications: true,
            sessionTimeout: 30,
            autoBackup: false,
            backupFrequency: 'weekly'
        };
        this.init();
    }

    init() {
        this.loadSettings();
        this.applyTheme(this.settings.theme);
        this.setupEventListeners();
        this.injectThemeCSS();
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('schoolSystemSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
        this.currentTheme = this.settings.theme;
    }

    saveSettings() {
        localStorage.setItem('schoolSystemSettings', JSON.stringify(this.settings));
        this.broadcastSettingsChange();
    }

    applyTheme(theme) {
        this.currentTheme = theme;
        this.settings.theme = theme;
        
        // Remove existing theme classes
        document.body.classList.remove('light-theme', 'dark-theme', 'blue-theme');
        
        // Add new theme class
        document.body.classList.add(theme + '-theme');
        
        // Update theme CSS link
        this.updateThemeCSS(theme);
        
        // Save settings
        this.saveSettings();
        
        // Broadcast theme change to other windows/tabs
        this.broadcastThemeChange(theme);
    }

    updateThemeCSS(theme) {
        let themeLink = document.getElementById('theme-css');
        if (!themeLink) {
            themeLink = document.createElement('link');
            themeLink.id = 'theme-css';
            themeLink.rel = 'stylesheet';
            document.head.appendChild(themeLink);
        }
        
        // Determine correct path based on current location
        const currentPath = window.location.pathname;
        let cssPath;
        
        if (currentPath.includes('/modules/')) {
            cssPath = `../css/themes/${theme}-theme.css`;
        } else {
            cssPath = `css/themes/${theme}-theme.css`;
        }
        
        themeLink.href = cssPath;
    }

    injectThemeCSS() {
        // Inject theme CSS if not already present
        if (!document.getElementById('theme-css')) {
            this.updateThemeCSS(this.currentTheme);
        }
    }

    applyFontSize(size) {
        this.settings.fontSize = size;
        
        // Remove existing font size classes
        document.body.classList.remove('font-small', 'font-medium', 'font-large');
        
        // Add new font size class
        document.body.classList.add('font-' + size);
        
        this.saveSettings();
    }

    applySidebarPosition(position) {
        this.settings.sidebarPosition = position;
        
        // Remove existing position classes
        document.body.classList.remove('sidebar-left', 'sidebar-right');
        
        // Add new position class
        document.body.classList.add('sidebar-' + position);
        
        this.saveSettings();
    }

    broadcastThemeChange(theme) {
        // Use localStorage event to communicate between tabs
        localStorage.setItem('themeChangeEvent', JSON.stringify({
            theme: theme,
            timestamp: Date.now()
        }));
        
        // Use BroadcastChannel for modern browsers
        if (window.BroadcastChannel) {
            const channel = new BroadcastChannel('school-system-theme');
            channel.postMessage({
                type: 'THEME_CHANGE',
                theme: theme,
                settings: this.settings
            });
        }
    }

    broadcastSettingsChange() {
        // Broadcast all settings changes
        localStorage.setItem('settingsChangeEvent', JSON.stringify({
            settings: this.settings,
            timestamp: Date.now()
        }));
        
        if (window.BroadcastChannel) {
            const channel = new BroadcastChannel('school-system-settings');
            channel.postMessage({
                type: 'SETTINGS_CHANGE',
                settings: this.settings
            });
        }
    }

    setupEventListeners() {
        // Listen for storage events (cross-tab communication)
        window.addEventListener('storage', (e) => {
            if (e.key === 'themeChangeEvent') {
                const data = JSON.parse(e.newValue);
                if (data.theme !== this.currentTheme) {
                    this.applyTheme(data.theme);
                }
            } else if (e.key === 'settingsChangeEvent') {
                const data = JSON.parse(e.newValue);
                this.settings = data.settings;
                this.applyAllSettings();
            }
        });

        // Listen for BroadcastChannel messages
        if (window.BroadcastChannel) {
            const themeChannel = new BroadcastChannel('school-system-theme');
            themeChannel.addEventListener('message', (e) => {
                if (e.data.type === 'THEME_CHANGE' && e.data.theme !== this.currentTheme) {
                    this.applyTheme(e.data.theme);
                }
            });

            const settingsChannel = new BroadcastChannel('school-system-settings');
            settingsChannel.addEventListener('message', (e) => {
                if (e.data.type === 'SETTINGS_CHANGE') {
                    this.settings = e.data.settings;
                    this.applyAllSettings();
                }
            });
        }
    }

    applyAllSettings() {
        this.applyTheme(this.settings.theme);
        this.applyFontSize(this.settings.fontSize);
        this.applySidebarPosition(this.settings.sidebarPosition);
        
        // Apply other settings as needed
        if (typeof updateLanguage === 'function') {
            updateLanguage(this.settings.defaultLanguage);
        }
    }

    // Method to be called from settings module
    updateSetting(key, value) {
        this.settings[key] = value;
        
        switch (key) {
            case 'theme':
                this.applyTheme(value);
                break;
            case 'fontSize':
                this.applyFontSize(value);
                break;
            case 'sidebarPosition':
                this.applySidebarPosition(value);
                break;
            default:
                this.saveSettings();
                break;
        }
    }

    // Get current settings
    getSettings() {
        return { ...this.settings };
    }

    // Reset to default settings
    resetToDefaults() {
        this.settings = {
            theme: 'light',
            fontSize: 'medium',
            sidebarPosition: 'left',
            defaultLanguage: 'en',
            currency: 'TZS',
            dateFormat: 'DD/MM/YYYY',
            autoSave: true,
            emailNotifications: true,
            pushNotifications: false,
            soundNotifications: true,
            sessionTimeout: 30,
            autoBackup: false,
            backupFrequency: 'weekly'
        };
        
        this.applyAllSettings();
        this.saveSettings();
    }
}

// Create global instance
window.globalThemeManager = new GlobalThemeManager();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlobalThemeManager;
}
