/**
 * Web SSH Client Configuration
 * 
 * This file contains all configurable parameters for the frontend application.
 * Modify these values to customize the behavior without touching the main application code.
 */

window.WebSSHConfig = {
    // ===========================================
    // CONNECTION SETTINGS
    // ===========================================
    connection: {
        // WebSocket connection settings
        maxRetries: 3,                    // Maximum reconnection attempts
        retryDelay: 1000,                 // Initial retry delay in milliseconds (uses exponential backoff)
        connectionTimeout: 10000,         // Connection timeout in milliseconds
        
        // HTMX configuration
        htmxTimeout: 10000,              // HTMX request timeout
        htmxSwapStyle: 'innerHTML',      // Default HTMX swap style
        includeIndicatorStyles: false,   // Whether to include HTMX loading indicators
    },

    // ===========================================
    // AUTHENTICATION SETTINGS
    // ===========================================
    auth: {
        // API key validation
        minKeyLength: 8,                 // Minimum API key length
        maxKeyLength: 256,               // Maximum API key length
        keyPattern: /^[A-Za-z0-9\-_]+$/, // Allowed characters in API key
        
        // Development mode settings
        enableURLParameter: true,        // Allow API key via URL parameter (?api_key=xxx)
        enableDummyAuth: true,           // Enable dummy authentication (development only)
        
        // Session management
        useSessionStorage: true,         // Store API key in sessionStorage vs memory only
        clearOnUnload: true,             // Clear API key when page unloads
    },

    // ===========================================
    // TERMINAL SETTINGS
    // ===========================================
    terminal: {
        // xterm.js configuration
        theme: {
            background: '#1a1a1a',
            foreground: '#ffffff',
            cursor: '#ffffff',
            cursorAccent: '#000000',
            selection: '#3e4451',
            black: '#1e1e1e',
            red: '#f44747',
            green: '#608b4e',
            yellow: '#dcdcaa',
            blue: '#569cd6',
            magenta: '#c678dd',
            cyan: '#56b6c2',
            white: '#d4d4d4',
            brightBlack: '#808080',
            brightRed: '#f44747',
            brightGreen: '#608b4e',
            brightYellow: '#dcdcaa',
            brightBlue: '#569cd6',
            brightMagenta: '#c678dd',
            brightCyan: '#56b6c2',
            brightWhite: '#ffffff'
        },
        
        // Font settings
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,                    // Default font size (desktop)
        fontSizeMobile: 12,              // Font size for mobile devices
        fontSizeMobileLandscape: 11,     // Font size for mobile landscape
        lineHeight: 1.2,                 // Default line height
        lineHeightMobile: 1.1,           // Line height for mobile
        
        // Terminal behavior
        cursorBlink: true,
        cursorStyle: 'block',            // 'block', 'underline', or 'bar'
        scrollback: 1000,                // Number of lines to keep in scrollback
        tabStopWidth: 4,                 // Tab stop width
        
        // Mobile responsiveness breakpoints
        mobileBreakpoint: 428,           // Width below which mobile optimizations apply
        mobileLandscapeBreakpoint: 926,  // Width for mobile landscape detection
    },

    // ===========================================
    // UI/UX SETTINGS
    // ===========================================
    ui: {
        // Toast notifications
        toastDuration: 5000,             // How long toasts stay visible (ms)
        toastPosition: 'top-right',      // Toast position: 'top-right', 'top-left', 'bottom-right', 'bottom-left'
        
        // Error handling
        maxErrorCount: 3,                // Show reload suggestion after this many errors
        authErrorDuration: 5000,         // How long auth errors are shown (ms)
        
        // Animation and timing
        resizeDebounceDelay: 250,        // Delay for window resize handling
        terminalInitDelay: 100,          // Delay before initializing terminal
        connectionInitDelay: 100,        // Delay before connecting WebSocket after auth
        
        // Status indicator colors (Tailwind classes)
        statusColors: {
            ready: 'bg-green-500',
            connecting: 'bg-yellow-500',
            connected: 'bg-green-500', 
            disconnected: 'bg-red-500',
            reconnecting: 'bg-yellow-500',
            error: 'bg-red-500',
            offline: 'bg-gray-500'
        },
        
        // Status animations
        animatedStatuses: ['connecting', 'reconnecting', 'error'], // Which statuses should animate/pulse
    },

    // ===========================================
    // MOBILE OPTIMIZATION
    // ===========================================
    mobile: {
        // Keyboard handling
        enableMobileKeyboard: true,      // Enable mobile-specific keyboard handling
        keyboardInputType: 'text',       // Input type for hidden keyboard field
        
        // Touch behavior
        enableTouchToFocus: true,        // Focus terminal when tapped
        
        // Auto-corrections (disable for terminal use)
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        spellcheck: false,
        
        // Viewport handling
        enableSafeArea: true,            // Handle device safe areas (notch, home indicator)
        enableViewportUnits: true,       // Use --vh and --vw CSS custom properties
    },

    // ===========================================
    // KEYBOARD SHORTCUTS
    // ===========================================
    keyboard: {
        shortcuts: {
            clearTerminal: { ctrl: true, key: 'k' },      // Ctrl+K or Cmd+K to clear terminal
            refreshApp: { ctrl: true, shift: true, key: 'r' }, // Ctrl+Shift+R to refresh
            dismissKeyboard: { key: 'Escape' },           // Escape to dismiss mobile keyboard
        }
    },

    // ===========================================
    // LOGGING AND DEBUGGING
    // ===========================================
    debug: {
        enableConsoleLogging: true,      // Enable console.log statements
        logWebSocketMessages: true,      // Log WebSocket message details
        logConnectionEvents: true,       // Log connection state changes
        logKeyboardEvents: false,        // Log keyboard interactions (can be noisy)
        logResizeEvents: false,          // Log window resize events (can be noisy)
        
        // Log levels - set to false to disable
        logLevels: {
            error: true,                 // Always show errors
            warn: true,                  // Show warnings
            info: true,                  // Show info messages
            debug: false,                // Detailed debug info (verbose)
        }
    },

    // ===========================================
    // SECURITY SETTINGS
    // ===========================================
    security: {
        // Input validation
        sanitizeInputs: true,            // Sanitize all user inputs
        maxInputLength: 10000,           // Maximum length for terminal input
        
        // WebSocket security
        validateMessageFormat: true,     // Validate incoming WebSocket messages
        
        // Development warnings
        showDevelopmentWarnings: true,   // Show warnings about development features
    },

    // ===========================================
    // FEATURE FLAGS
    // ===========================================
    features: {
        // Development features (disable in production)
        enableURLAPIKey: true,           // Allow API key in URL parameters
        enableDummyAuth: true,           // Use dummy authentication
        
        // UI features
        enableMenuButton: true,          // Show menu button (future feature)
        enableToastNotifications: true,  // Show toast notifications
        enableSystemMessages: true,      // Show system messages in terminal
        
        // Terminal features
        enableTerminalInfo: true,        // Show terminal size info
        enableConnectionStatus: true,    // Show connection status indicator
        enableKeyboardShortcuts: true,   // Enable keyboard shortcuts
    },

    // ===========================================
    // MESSAGE HANDLING
    // ===========================================
    messages: {
        // Message type handling
        enableStructuredMessages: true,  // Parse JSON messages from backend
        fallbackToPlainText: true,       // Fall back to plain text for non-JSON messages
        
        // ANSI handling
        enableAnsiProcessing: true,      // Process ANSI escape codes in terminal output
        
        // Connection messages
        showConnectionMessages: true,    // Show connection state changes as system messages
        showWelcomeMessage: true,        // Show welcome message on connection
    }
};

// ===========================================
// ENVIRONMENT-SPECIFIC OVERRIDES
// ===========================================

// Detect environment and apply overrides
(function() {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isDevelopment = isLocalhost || hostname.includes('dev') || hostname.includes('staging');
    
    if (!isDevelopment) {
        // Production overrides
        Object.assign(window.WebSSHConfig.debug, {
            enableConsoleLogging: false,
            logWebSocketMessages: false,
            logConnectionEvents: false,
            logLevels: {
                error: true,
                warn: false,
                info: false,
                debug: false,
            }
        });
        
        Object.assign(window.WebSSHConfig.features, {
            enableURLAPIKey: false,      // Disable URL API keys in production
            enableDummyAuth: false,      // Disable dummy auth in production
        });
        
        Object.assign(window.WebSSHConfig.security, {
            showDevelopmentWarnings: false,
        });
    }
})();

// ===========================================
// VALIDATION
// ===========================================

// Basic config validation
(function validateConfig() {
    const config = window.WebSSHConfig;
    
    // Validate required sections
    const requiredSections = ['connection', 'auth', 'terminal', 'ui', 'mobile'];
    requiredSections.forEach(section => {
        if (!config[section]) {
            console.error(`❌ WebSSHConfig: Missing required section '${section}'`);
        }
    });
    
    // Validate numeric ranges
    if (config.auth.minKeyLength < 1 || config.auth.minKeyLength > config.auth.maxKeyLength) {
        console.error('❌ WebSSHConfig: Invalid API key length settings');
    }
    
    if (config.connection.maxRetries < 0 || config.connection.retryDelay < 100) {
        console.error('❌ WebSSHConfig: Invalid connection retry settings');
    }
    
    if (config.terminal.fontSize < 6 || config.terminal.fontSize > 72) {
        console.error('❌ WebSSHConfig: Invalid terminal font size');
    }
    
    console.log('✅ WebSSH Configuration loaded and validated');
})();