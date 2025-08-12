/**
 * App.js - Main application controller and HTMX integration
 * Coordinates terminal, mobile handling, and WebSocket functionality through HTMX
 * 
 * ============================================================================
 * TRANSITION GUIDE: FROM DUMMY TO REAL API KEY AUTHENTICATION
 * ============================================================================
 * 
 * CURRENT STATE (Development):
 * - URL parameter API keys work: ?api_key=22222222
 * - Form accepts any 8+ character alphanumeric key
 * - All validation happens locally in frontend
 * - No backend calls are made
 * 
 * STEP-BY-STEP IMPLEMENTATION GUIDE:
 * 
 * STEP 1: Backend API Key Endpoint
 * --------------------------------
 * Implement POST /validate-key endpoint in your backend:
 * - Accept: application/x-www-form-urlencoded
 * - Parameter: api_key
 * - Return 200 for valid keys, 401 for invalid
 * 
 * STEP 2: Frontend Changes (in this file)
 * ---------------------------------------
 * 1. In setupHTMXEventListeners(), COMMENT OUT these lines:
 *    // event.preventDefault();
 *    // this.handleDummyAuth(event);
 *    // return;
 * 
 * 2. OPTIONAL: Remove URL parameter feature for security:
 *    - Delete checkURLAPIKey() method
 *    - Remove this.checkURLAPIKey() call from init()
 * 
 * 3. DELETE these development methods:
 *    - dummyValidateAPIKey()
 *    - handleDummyAuth()
 * 
 * 4. REMOVE the fallback in htmx:sendError event handler
 * 
 * STEP 3: WebSocket Authentication
 * --------------------------------
 * Update your WebSocket handler to:
 * - Check api_key parameter in connection URL
 * - Reject connections with invalid keys
 * - The frontend automatically includes the API key
 * 
 * STEP 4: Optional Security Enhancements
 * --------------------------------------
 * - Add rate limiting for auth attempts
 * - Add API key rotation/expiration
 * - Log authentication attempts
 * - Use environment variables for API key storage
 * 
 * TESTING THE TRANSITION:
 * - Test form submission with valid/invalid keys
 * - Test WebSocket connection with authenticated API key
 * - Test error handling when server is unavailable
 * - Verify URL parameter feature works (or is disabled)
 * 
 * ============================================================================
 */

class WebSSHApp {
    constructor() {
        this.isInitialized = false;
        this.connectionState = 'disconnected';
        this.terminal = null;
        this.retryCount = 0;
        this.apiKey = null;
        this.config = window.WebSSHConfig;
        
        // Validate config is loaded
        if (!this.config) {
            console.error('❌ WebSSHConfig not found. Make sure config.js is loaded before app.js');
            return;
        }
        
        this.init();
    }
    
    async init() {
        console.log('🚀 Initializing Web SSH Application...');
        
        try {
            // Setup application components
            this.setupHTMX();
            this.setupErrorHandling();
            this.setupConnectionManagement();
            this.setupUI();
            this.setupSecureStorage();
            
            // Check for URL parameter API key (for development)
            this.checkURLAPIKey();
            
            this.isInitialized = true;
            console.log('✅ Web SSH Application initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.showError('Application initialization failed', error.message);
        }
    }
    
    setupSecureStorage() {
        // Setup secure API key handling
        if (this.config.auth.clearOnUnload) {
            window.addEventListener('beforeunload', () => {
                this.clearAPIKey();
            });
        }
        
        console.log('🔐 Secure storage setup complete');
    }
    
    setAPIKey(key) {
        this.apiKey = key;
        if (this.config.auth.useSessionStorage) {
            sessionStorage.setItem('ssh_api_key', key);
        }
    }
    
    getAPIKey() {
        if (this.config.auth.useSessionStorage) {
            return this.apiKey || sessionStorage.getItem('ssh_api_key');
        }
        return this.apiKey;
    }
    
    clearAPIKey() {
        this.apiKey = null;
        if (this.config.auth.useSessionStorage) {
            sessionStorage.removeItem('ssh_api_key');
        }
    }
    
    checkURLAPIKey() {
        // ==========================================
        // DEVELOPMENT FEATURE: URL Parameter API Key
        // ==========================================
        // This allows bypassing the auth form during development using ?api_key=xxx
        // 
        // WHEN IMPLEMENTING REAL API KEYS:
        // 1. SECURITY: Consider removing this feature entirely for production
        // 2. OR: Only enable this in development environment (check NODE_ENV)
        // 3. OR: Keep but validate against real backend instead of dummy validation
        //
        // TO REMOVE THIS FEATURE:
        // - Delete this entire method
        // - Remove the call to this.checkURLAPIKey() from init()
        // ==========================================
        
        if (!this.config.auth.enableURLParameter) {
            return; // URL parameter feature disabled
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const urlApiKey = urlParams.get('api_key');
        
        if (urlApiKey) {
            console.log('🔑 API key found in URL parameters (DEVELOPMENT MODE)');
            
            // REPLACE THIS: Change dummyValidateAPIKey to real backend validation
            if (this.dummyValidateAPIKey(urlApiKey)) {
                this.setAPIKey(urlApiKey);
                this.bypassAuthForm();
                
                // Clean URL to remove API key from address bar (security best practice)
                const cleanUrl = new URL(window.location);
                cleanUrl.searchParams.delete('api_key');
                window.history.replaceState({}, document.title, cleanUrl);
                
                console.log('✅ API key accepted via URL parameter (DEVELOPMENT)');
            } else {
                console.warn('⚠️  Invalid API key format in URL');
                this.showAuthError('Invalid API key format in URL');
            }
        }
    }
    
    dummyValidateAPIKey(key) {
        // ==========================================
        // DUMMY VALIDATION - DEVELOPMENT ONLY
        // ==========================================
        // This accepts any API key with basic format requirements
        // 
        // WHEN IMPLEMENTING REAL API KEYS:
        // 1. DELETE this method entirely
        // 2. Replace all calls to dummyValidateAPIKey() with validateAPIKey()
        // 3. Create new validateAPIKey() method that calls backend
        // 
        // EXAMPLE REPLACEMENT:
        // async validateAPIKey(key) {
        //     try {
        //         const response = await fetch('/validate-key', {
        //             method: 'POST',
        //             headers: { 'Content-Type': 'application/json' },
        //             body: JSON.stringify({ api_key: key })
        //         });
        //         return response.ok;
        //     } catch (error) {
        //         return false;
        //     }
        // }
        // ==========================================
        
        return key && 
               key.length >= this.config.auth.minKeyLength && 
               key.length <= this.config.auth.maxKeyLength && 
               this.config.auth.keyPattern.test(key);
    }
    
    bypassAuthForm() {
        // Skip the authentication form and go directly to main app
        const authScreen = document.getElementById('auth-screen');
        const mainApp = document.getElementById('main-app');
        
        if (authScreen) {
            authScreen.style.display = 'none';
        }
        
        if (mainApp) {
            mainApp.classList.remove('hidden');
            mainApp.classList.add('flex', 'flex-col');
        }
        
        console.log('🔄 Switched from auth to main app');
        
        // Initialize WebSocket connection
        setTimeout(() => {
            this.connectWebSocket();
        }, this.config.ui.connectionInitDelay);
    }
    
    handleDummyAuth(event) {
        // ==========================================
        // DUMMY AUTHENTICATION - DEVELOPMENT ONLY
        // ==========================================
        // This handles form submissions locally without backend calls
        // 
        // WHEN IMPLEMENTING REAL API KEYS:
        // 1. DELETE this method entirely
        // 2. Remove the event.preventDefault() in setupHTMXEventListeners()
        // 3. Let HTMX handle the real /validate-key endpoint
        // 4. The handleAuthResponse() method will handle real server responses
        // ==========================================
        
        console.log('🔧 Using dummy authentication (development mode)');
        
        const formData = new FormData(event.detail.elt || event.target.closest('form'));
        const apiKey = this.sanitizeInput(formData.get('api_key'));
        
        if (this.dummyValidateAPIKey(apiKey)) {
            this.setAPIKey(apiKey);
            this.bypassAuthForm();
            console.log('✅ Dummy authentication successful');
        } else {
            this.showAuthError('Invalid API key format (must be 8+ characters, alphanumeric only)');
        }
    }
    
    setupHTMX() {
        console.log('⚡ Setting up HTMX integration...');
        
        // Wait for HTMX to be available (since it's loaded asynchronously)
        const checkHTMX = () => {
            if (typeof htmx !== 'undefined') {
                // Set HTMX configuration
                htmx.config.defaultSwapStyle = this.config.connection.htmxSwapStyle;
                htmx.config.timeout = this.config.connection.htmxTimeout;
                htmx.config.includeIndicatorStyles = this.config.connection.includeIndicatorStyles;
                
                // Setup HTMX event listeners
                this.setupHTMXEventListeners();
                
                console.log('✅ HTMX configured successfully');
            } else {
                // Retry after a short delay
                setTimeout(checkHTMX, 100);
            }
        };
        
        // Start checking immediately
        checkHTMX();
    }
    
    setupHTMXEventListeners() {
        // Authentication events
        document.addEventListener('htmx:beforeRequest', (event) => {
            // Add API key to WebSocket connection
            if (event.detail.elt.hasAttribute('ws-connect')) {
                const apiKey = this.getAPIKey();
                if (apiKey) {
                    const url = new URL(event.detail.requestConfig.path, window.location);
                    url.searchParams.set('api_key', apiKey);
                    event.detail.requestConfig.path = url.pathname + url.search;
                }
            }
        });
        
        // Direct WebSocket events are handled in connectWebSocket() method
        
        // Authentication form events
        document.addEventListener('htmx:beforeRequest', (event) => {
            if (event.detail.pathInfo.requestPath === '/validate-key') {
                // ==========================================
                // DEVELOPMENT MODE: Intercept auth requests
                // ==========================================
                // This prevents real backend calls and handles auth locally
                // 
                // WHEN IMPLEMENTING REAL API KEYS:
                // REMOVE/COMMENT OUT these 3 lines to allow real backend calls:
                if (this.config.auth.enableDummyAuth) {
                    event.preventDefault();
                    this.handleDummyAuth(event);
                    return;
                }
                // ==========================================
            }
        });
        
        document.addEventListener('htmx:afterRequest', (event) => {
            if (event.detail.pathInfo.requestPath === '/validate-key') {
                this.handleAuthResponse(event);
            }
        });
        
        // HTTP request events
        document.addEventListener('htmx:sendError', (event) => {
            console.error('❌ HTMX send error:', event.detail);
            if (event.detail.pathInfo?.requestPath === '/validate-key') {
                // ==========================================
                // DEVELOPMENT FALLBACK: Server not available
                // ==========================================
                // If the backend server is not running, fall back to dummy auth
                // 
                // WHEN IMPLEMENTING REAL API KEYS:
                // REMOVE this fallback - show real error instead:
                // this.showAuthError('Server unavailable. Please try again.');
                // ==========================================
                if (this.config.auth.enableDummyAuth) {
                    this.handleDummyAuth(event);
                } else {
                    this.showAuthError('Server unavailable. Please try again.');
                }
            } else {
                this.showError('Network Error', 'Failed to send request');
            }
        });
        
        document.addEventListener('htmx:responseError', (event) => {
            console.error('❌ HTMX response error:', event.detail);
            if (event.detail.xhr.status === 401) {
                this.showAuthError('Invalid API key');
            } else {
                this.showError('Server Error', 'Server returned an error');
            }
        });
    }
    
    setupErrorHandling() {
        // Global error handling
        window.addEventListener('error', (event) => {
            console.error('💥 Global error:', event.error);
            this.handleCriticalError('Application Error', event.error.message);
        });
        
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('💥 Unhandled promise rejection:', event.reason);
            this.handleCriticalError('Application Error', 'An unexpected error occurred');
            event.preventDefault(); // Prevent default browser behavior
        });
        
        // Security violation handling
        window.addEventListener('securitypolicyviolation', (event) => {
            console.error('🚨 CSP Violation:', event.violatedDirective, event.blockedURI);
            // Don't show user-facing error for security violations
        });
        
        console.log('🛡️  Error handling setup complete');
    }
    
    handleCriticalError(title, message) {
        // Handle critical errors that may compromise security
        console.error('🚨 Critical error:', title, message);
        
        // Clear sensitive data
        this.clearAPIKey();
        
        // Show error and provide recovery option
        this.showError(title, message);
        
        // If too many critical errors, suggest reload
        this.errorCount = (this.errorCount || 0) + 1;
        if (this.errorCount >= this.config.ui.maxErrorCount) {
            this.showToast('Multiple errors detected. Please reload the page.', 'error');
        }
    }
    
    setupConnectionManagement() {
        // Monitor network connectivity
        window.addEventListener('online', () => {
            console.log('🌐 Network back online');
            this.updateConnectionStatus('ready');
        });
        
        window.addEventListener('offline', () => {
            console.log('📵 Network offline');
            this.updateConnectionStatus('offline');
        });
        
        // Page visibility handling
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Refit terminal when page becomes visible
                if (this.terminal) {
                    setTimeout(() => this.terminal.fitTerminal(), 100);
                }
            }
        });
        
        console.log('🔗 Connection management setup complete');
    }
    
    setupUI() {
        // Setup menu button functionality
        const menuButton = document.getElementById('menu-button');
        if (menuButton) {
            menuButton.addEventListener('click', () => {
                this.toggleMenu();
            });
        }
        
        // Setup keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });
        
        // Setup responsive behavior
        this.setupResponsiveBehavior();
        
        console.log('🎨 UI setup complete');
    }
    
    setupResponsiveBehavior() {
        // Handle window resize for responsive behavior
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, this.config.ui.resizeDebounceDelay);
        });
        
        // Initial responsive check
        this.handleResize();
    }
    
    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isPortrait = height > width;
        
        // Update CSS custom properties for responsive design
        document.documentElement.style.setProperty('--vh', `${height * 0.01}px`);
        document.documentElement.style.setProperty('--vw', `${width * 0.01}px`);
        
        // Update terminal info
        const terminalInfo = document.getElementById('terminal-info');
        if (terminalInfo) {
            terminalInfo.textContent = `${width}×${height} ${isPortrait ? '📱' : '💻'}`;
        }
        
        // Refit terminal
        if (this.terminal) {
            setTimeout(() => this.terminal.fitTerminal(), this.config.ui.terminalInitDelay);
        }
    }
    
    handleAuthResponse(event) {
        // ==========================================
        // REAL BACKEND RESPONSE HANDLER
        // ==========================================
        // This method handles actual server responses from /validate-key endpoint
        // It's ready for real backend integration - no changes needed!
        // 
        // Expected server responses:
        // - 200: API key is valid
        // - 401: API key is invalid/unauthorized  
        // - 400: Bad request format
        // - 500: Server error
        // ==========================================
        
        if (event.detail.xhr.status === 200) {
            // Success - store API key and show main app
            const formData = new FormData(event.detail.elt);
            const apiKey = this.sanitizeInput(formData.get('api_key'));
            
            if (this.validateAPIKey(apiKey)) {
                this.setAPIKey(apiKey);
                
                // Hide auth screen and show main app
                document.getElementById('auth-screen').style.display = 'none';
                document.getElementById('main-app').classList.remove('hidden');
                document.getElementById('main-app').classList.add('flex');
                
                // Initialize WebSocket connection
                setTimeout(() => {
                    this.connectWebSocket();
                }, this.config.ui.connectionInitDelay);
            } else {
                this.showAuthError('Invalid API key format');
            }
        } else {
            this.showAuthError('Authentication failed');
        }
    }
    
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        return input.trim().replace(/[^\w\-_]/g, '');
    }
    
    validateAPIKey(key) {
        return key && 
               key.length >= this.config.auth.minKeyLength && 
               key.length <= this.config.auth.maxKeyLength && 
               this.config.auth.keyPattern.test(key);
    }
    
    connectWebSocket() {
        // Create direct WebSocket connection for terminal data
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const apiKey = this.getAPIKey();
        
        let wsUrl = `${protocol}//${host}/ws`;
        if (apiKey) {
            wsUrl += `?api_key=${encodeURIComponent(apiKey)}`;
        }
        
        console.log('🔌 Connecting to WebSocket:', wsUrl);
        
        this.directWebSocket = new WebSocket(wsUrl);
        
        this.directWebSocket.onopen = () => {
            console.log('✅ WebSocket connected');
            this.updateConnectionStatus('connected');
            // Initialize terminal connection
            this.initializeTerminal();
        };
        
        this.directWebSocket.onmessage = (event) => {
            console.log('📨 Terminal message:', event.data);
            this.handleWebSocketMessage(event.data);
        };
        
        this.directWebSocket.onclose = () => {
            console.log('🔌 WebSocket disconnected');
            this.updateConnectionStatus('disconnected');
        };
        
        this.directWebSocket.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            this.updateConnectionStatus('error');
        };
    }
    
    initializeTerminal() {
        // Wait for terminal to be ready and initialize it
        const checkTerminal = () => {
            if (window.webSSHTerminal && window.webSSHTerminal.isReady()) {
                this.terminal = window.webSSHTerminal;
                document.dispatchEvent(new Event('webssh:ready'));
                console.log('🖥️  Terminal initialized with WebSocket connection');
                
                // If we're already connected, show the connected state immediately
                if (this.connectionState === 'connected') {
                    console.log('🎯 WebSocket already connected, showing connected state');
                    this.terminal.showConnectedState();
                    
                    // Send initial prompt request to backend (for SSH simulation)
                    setTimeout(() => {
                        this.requestInitialPrompt();
                    }, 500);
                }
            } else {
                setTimeout(checkTerminal, 100);
            }
        };
        setTimeout(checkTerminal, 100);
    }
    
    requestInitialPrompt() {
        // Send a special message to backend to request initial shell prompt
        // This simulates what happens when SSH connection is established
        if (this.directWebSocket && this.directWebSocket.readyState === WebSocket.OPEN) {
            const message = {
                type: 'request_prompt',
                data: 'init',
                timestamp: new Date().toISOString()
            };
            console.log('🎯 Requesting initial prompt from backend');
            this.directWebSocket.send(JSON.stringify(message));
        }
    }

    sendToBackend(data) {
        // Send data through direct WebSocket connection using structured messages
        if (this.directWebSocket && this.directWebSocket.readyState === WebSocket.OPEN) {
            const message = {
                type: 'terminal_input',
                data: data,
                timestamp: new Date().toISOString()
            };
            // Log only first few characters to avoid cluttering console with every keystroke
            const displayData = data.length > 10 ? data.substring(0, 10) + '...' : data;
            const isSpecialChar = data.charCodeAt(0) < 32;
            if (isSpecialChar || data.length > 1) {
                console.log('📤 Sending special/multi-char input:', JSON.stringify(message));
            }
            this.directWebSocket.send(JSON.stringify(message));
        } else {
            console.warn('⚠️  WebSocket not connected, cannot send data');
        }
    }

    handleWebSocketMessage(message) {
        // ==========================================
        // ENHANCED WEBSOCKET MESSAGE PARSING
        // ==========================================
        // Handles structured JSON messages from backend with proper terminal rendering
        // 
        // SUPPORTED MESSAGE TYPES:
        // - terminal_output: Raw terminal output (with ANSI colors and metadata)
        // - terminal_error: Error messages (displayed in red)
        // - system_message: System notifications
        // - connection_state: Connection status updates
        // ==========================================
        
        try {
            // Try to parse as JSON for structured messages
            const data = JSON.parse(message);
            console.log('📨 Received WebSocket message:', data.type, data.metadata ? '(with metadata)' : '');
            
            switch (data.type) {
                case 'terminal_output':
                    this.handleTerminalOutput(data);
                    break;
                    
                case 'terminal_error':
                    this.handleTerminalError(data);
                    break;
                    
                case 'system_message':
                    this.handleSystemMessage(data);
                    break;
                    
                case 'connection_state':
                    this.handleConnectionStateMessage(data);
                    break;
                    
                default:
                    console.warn('⚠️  Unknown message type:', data.type);
                    // Treat unknown structured messages as plain terminal output
                    if (this.terminal && data.data) {
                        this.terminal.write(data.data);
                    }
            }
            
        } catch (error) {
            // Not JSON - treat as plain terminal output for backward compatibility
            if (this.terminal && typeof message === 'string') {
                console.log('📨 Plain text message (fallback):', message.substring(0, 100) + '...');
                this.renderTerminalData(message);
            }
        }
    }
    
    handleTerminalOutput(messageData) {
        if (!this.terminal) {
            console.warn('⚠️  Terminal not available for output');
            return;
        }
        
        const { data, metadata } = messageData;
        
        // Log command completion if available
        if (metadata?.command && metadata?.exit_code !== undefined) {
            console.log(`🖥️  Command completed: "${metadata.command}" (exit code: ${metadata.exit_code})`);
        }
        
        // Render the terminal output using proper xterm API
        this.renderTerminalData(data, metadata);
        
        // Handle command completion status
        if (metadata?.exit_code !== undefined) {
            this.handleCommandCompletion(metadata.command, metadata.exit_code);
        }
    }
    
    handleTerminalError(messageData) {
        if (!this.terminal) {
            console.warn('⚠️  Terminal not available for error display');
            return;
        }
        
        const { data } = messageData;
        console.error('💥 Terminal error:', data);
        
        // Display error in red with proper formatting
        this.terminal.writeln('');
        this.terminal.write('\x1b[31m✗ Error: \x1b[0m');
        this.terminal.writeln(data);
        this.terminal.writeln('');
    }
    
    handleSystemMessage(messageData) {
        const { data } = messageData;
        console.log('📢 System message:', data);
        
        // Display in terminal as a system notification
        if (this.terminal) {
            this.terminal.writeln('');
            this.terminal.write('\x1b[36m🔔 System: \x1b[0m');
            this.terminal.writeln(data);
            this.terminal.writeln('');
        }
        
        // Also show as toast notification
        this.showToast(data, 'info');
    }
    
    handleConnectionStateMessage(messageData) {
        try {
            const stateData = typeof messageData.data === 'string' ? 
                JSON.parse(messageData.data) : messageData.data;
            
            console.log('🔄 Connection state change:', stateData.state, stateData.message || '');
            
            // Update UI status
            this.updateConnectionStatus(stateData.state);
            
            // Handle terminal state changes
            if (this.terminal) {
                if (stateData.state === 'connected') {
                    // Show connected state in terminal
                    this.terminal.showConnectedState();
                } else if (stateData.message) {
                    // Display other state changes as system messages
                    const stateEmoji = {
                        'connecting': '🔄',
                        'disconnected': '❌',
                        'error': '💥'
                    };
                    
                    this.terminal.writeln('');
                    this.terminal.write(`\x1b[33m${stateEmoji[stateData.state] || '🔔'} ${stateData.message}\x1b[0m`);
                    this.terminal.writeln('');
                }
            }
            
        } catch (parseError) {
            console.warn('⚠️  Failed to parse connection state data:', parseError);
            this.updateConnectionStatus(messageData.data);
        }
    }
    
    renderTerminalData(data, metadata = null) {
        if (!this.terminal || !data) return;
        
        // Check if data contains ANSI escape codes
        const hasAnsi = metadata?.has_ansi ?? this.containsAnsiEscapeCodes(data);
        
        if (hasAnsi) {
            // Data has ANSI codes - let xterm.js handle them natively
            console.log('🎨 Rendering ANSI-formatted output');
            this.terminal.write(data);
        } else {
            // Plain text - write directly but ensure proper line handling
            this.terminal.write(data);
        }
    }
    
    containsAnsiEscapeCodes(text) {
        // Check for common ANSI escape sequences
        const ansiRegex = /\x1b\[[0-9;]*[mK]|\x1b\[[0-9;]*[ABCD]|\x1b\[[0-9;]*[JH]/;
        return ansiRegex.test(text);
    }
    
    handleCommandCompletion(command, exitCode) {
        // Visual feedback for command completion
        if (exitCode === 0) {
            console.log(`✅ Command succeeded: "${command}"`);
        } else {
            console.log(`❌ Command failed: "${command}" (exit code: ${exitCode})`);
            // Could add visual indicators in the terminal for failed commands
        }
    }
    
    handleConnectionLost() {
        console.log('🔌 Connection lost, attempting to reconnect...');
        this.updateConnectionStatus('reconnecting');
        // Future: implement reconnection logic
    }
    
    handleKeyboardShortcuts(event) {
        // Handle application-level keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'k':
                    // Clear terminal
                    event.preventDefault();
                    if (this.terminal) {
                        this.terminal.clear();
                        console.log('🧹 Terminal cleared via shortcut');
                    }
                    break;
                    
                case 'r':
                    // Refresh application
                    if (event.shiftKey) {
                        event.preventDefault();
                        location.reload();
                    }
                    break;
            }
        }
        
        // Escape key handling
        if (event.key === 'Escape') {
            // Dismiss mobile keyboard if visible
            if (window.mobileKeyboardHandler) {
                window.mobileKeyboardHandler.dismissKeyboard();
            }
        }
    }
    
    toggleMenu() {
        console.log('📱 Menu button clicked');
        // Future: implement menu functionality
        this.showToast('Menu feature coming soon!', 'info');
    }
    
    updateConnectionStatus(status) {
        this.connectionState = status;
        
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('#connection-status span');
        
        const statusConfig = {
            ready: { color: this.config.ui.statusColors.ready, text: 'Ready', animate: false },
            connecting: { color: this.config.ui.statusColors.connecting, text: 'Connecting...', animate: this.config.ui.animatedStatuses.includes('connecting') },
            connected: { color: this.config.ui.statusColors.connected, text: 'Connected', animate: false },
            disconnected: { color: this.config.ui.statusColors.disconnected, text: 'Disconnected', animate: false },
            reconnecting: { color: this.config.ui.statusColors.reconnecting, text: 'Reconnecting...', animate: this.config.ui.animatedStatuses.includes('reconnecting') },
            error: { color: this.config.ui.statusColors.error, text: 'Error', animate: this.config.ui.animatedStatuses.includes('error') },
            offline: { color: this.config.ui.statusColors.offline, text: 'Offline', animate: false }
        };
        
        const config = statusConfig[status] || statusConfig.disconnected;
        
        if (statusIndicator) {
            let className = `w-2 h-2 rounded-full ${config.color}`;
            if (config.animate) {
                className += ' animate-pulse';
            }
            statusIndicator.className = className;
            if (statusText) {
                statusText.textContent = config.text;
            }
        }
        
        console.log('🔄 Connection status updated:', status);
    }
    
    showError(title, message) {
        // Display error messages to the user
        console.error('❌ Error:', title, message);
        this.showToast(`${title}: ${message}`, 'error');
    }

    showAuthError(message) {
        // Display authentication error
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
            setTimeout(() => errorEl.classList.add('hidden'), this.config.ui.authErrorDuration);
        }
    }

    showSystemMessage(message) {
        // Display system messages (info, warnings, etc.)
        console.log('📢 System message:', message);
        this.showToast(message, 'info');
    }
    
    showToast(message, type = 'info') {
        // Display toast notifications
        console.log(`🍞 Toast ${type}:`, message);
        
        const toast = document.createElement('div');
        const colors = {
            info: 'bg-blue-600',
            error: 'bg-red-600',
            warning: 'bg-yellow-600',
            success: 'bg-green-600'
        };
        
        const positionClasses = {
            'top-right': 'top-4 right-4',
            'top-left': 'top-4 left-4', 
            'bottom-right': 'bottom-4 right-4',
            'bottom-left': 'bottom-4 left-4'
        };
        
        const position = positionClasses[this.config.ui.toastPosition] || positionClasses['top-right'];
        toast.className = `fixed ${position} ${colors[type] || colors.info} text-white p-4 rounded-lg shadow-lg z-50 max-w-sm`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, this.config.ui.toastDuration);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.webSSHApp = new WebSSHApp();
});