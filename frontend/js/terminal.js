/**
 * Terminal.js - xterm.js Terminal Emulator Configuration and Management
 * Optimized for mobile devices, specifically iPhone 13 Pro Max
 */

class WebSSHTerminal {
    constructor(containerId) {
        this.containerId = containerId;
        this.terminal = null;
        this.fitAddon = null;
        this.isInitialized = false;
        this.isMobile = this.detectMobile();
        
        // Terminal configuration optimized for real SSH terminal behavior
        this.config = {
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
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            fontSize: this.isMobile ? (window.innerWidth <= 428 ? 12 : 14) : 14,
            lineHeight: this.isMobile ? 1.1 : 1.2,
            cursorBlink: true,
            cursorStyle: 'block',
            scrollback: 1000,
            tabStopWidth: 4,
            allowTransparency: false,
            fontWeight: 'normal',
            fontWeightBold: 'bold',
            letterSpacing: 0,
            logLevel: 'warn',
            rightClickSelectsWord: false,
            // Enhanced terminal features for real SSH behavior
            convertEol: false,  // Let SSH server handle line endings
            disableStdin: false,
            macOptionIsMeta: false, // Disable for simulation
            macOptionClickForcesSelection: false,
            altClickMovesCursor: false, // Disable cursor clicking
            // Terminal escape sequence handling
            windowsMode: false,
            scrollOnUserInput: true,
            smoothScrollDuration: 0,
            fastScrollModifier: 'alt',
            fastScrollSensitivity: 5
        };
        
        this.init();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               'ontouchstart' in window || 
               navigator.maxTouchPoints > 0;
    }
    
    async init() {
        try {
            console.log('🖥️  Initializing Web SSH Terminal...');
            console.log('📱 Mobile device detected:', this.isMobile);
            console.log('📏 Screen dimensions:', window.innerWidth, 'x', window.innerHeight);
            
            // Initialize terminal
            this.terminal = new Terminal(this.config);
            
            // Initialize addons
            this.fitAddon = new FitAddon.FitAddon();
            this.terminal.loadAddon(this.fitAddon);
            
            // Load WebLinks addon for clickable links
            const webLinksAddon = new WebLinksAddon.WebLinksAddon();
            this.terminal.loadAddon(webLinksAddon);
            
            // Open terminal in the container
            const container = document.getElementById(this.containerId);
            if (!container) {
                throw new Error(`Terminal container '${this.containerId}' not found`);
            }
            
            this.terminal.open(container);
            
            // Fit terminal to container
            this.fitTerminal();
            
            // Set up event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            
            // Show connecting message and wait for backend connection
            this.showConnectingState();
            this.enableInput();
            
            // Also listen for WebSocket ready event
            document.addEventListener('webssh:ready', () => {
                // WebSocket is ready - could update status here
            }, { once: true });
        } catch (error) {
            console.error('❌ Failed to initialize terminal:', error);
            this.showError('Failed to initialize terminal: ' + error.message);
        }
    }

    showConnectingState() {
        if (!this.terminal) {
            // Create a temporary terminal for the connecting state
            this.terminal = new Terminal(this.config);
            const container = document.getElementById(this.containerId);
            if (container) this.terminal.open(container);
        }
        this.terminal.clear();
        this.terminal.writeln('\x1b[36m╭─────────────────────────────────────────────╮\x1b[0m');
        this.terminal.writeln('\x1b[36m│\x1b[0m         \x1b[1m\x1b[33mConnecting to server...\x1b[0m           \x1b[36m│\x1b[0m');
        this.terminal.writeln('\x1b[36m╰─────────────────────────────────────────────╯\x1b[0m');
        this.terminal.writeln('');
        this.terminal.writeln('  Please wait while the connection is established.');
        this.terminal.writeln('');
    }

    enableInput() {
        this.inputEnabled = true;
    }
    
    showConnectedState() {
        // Clear terminal and show welcome message when successfully connected
        if (this.terminal) {
            this.terminal.clear();
            this.showWelcomeMessage();
        }
    }
    
    setupEventListeners() {
        // Handle terminal input
        this.terminal.onData(data => {
            this.handleTerminalInput(data);
        });
        
        // Handle terminal resize
        this.terminal.onResize(({ cols, rows }) => {
            // Send resize event to backend for SSH pty
            this.notifyTerminalResize(cols, rows);
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.debounce(() => {
                this.fitTerminal();
                this.adjustMobileSettings();
            }, 100)();
        });
        
        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.fitTerminal();
                this.adjustMobileSettings();
            }, 500); // Delay to allow orientation change to complete
        });
        
        // Handle terminal focus for mobile keyboard
        const container = document.getElementById(this.containerId);
        container.addEventListener('focus', () => {
            console.log('🎯 Terminal focused');
        });
        
        // Handle visibility change (for mobile app switching)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.terminal) {
                this.fitTerminal();
            }
        });
    }
    
    handleTerminalInput(data) {
        if (!this.inputEnabled) return; // Ignore input until ready

        // TEMPORARY: Filter out arrow keys and other navigation for simple simulation
        // This will be removed when real SSH is implemented
        if (this.isNavigationKey(data)) {
            console.log('🚫 Navigation key filtered:', JSON.stringify(data));
            return; // Block navigation keys in simulation
        }

        // Send input to backend
        if (window.webSSHApp && typeof window.webSSHApp.sendToBackend === 'function') {
            window.webSSHApp.sendToBackend(data);
        } else {
            console.warn('⚠️  WebSSH app not available, cannot send terminal input');
        }
    }
    
    isNavigationKey(data) {
        // Filter out navigation keys for simple shell simulation
        // This prevents cursor movement bugs until real SSH is implemented
        if (data.length >= 3 && data[0] === '\x1b' && data[1] === '[') {
            const key = data[2];
            return key === 'A' || key === 'B' || key === 'C' || key === 'D'; // Arrow keys
        }
        
        // Block other navigation keys
        return data === '\x01' ||  // Ctrl+A (Home)
               data === '\x05' ||  // Ctrl+E (End)
               data === '\x0c';    // Ctrl+L (Clear)
    }
    
    notifyTerminalResize(cols, rows) {
        // Send terminal resize information to backend for SSH pty resize
        if (window.webSSHApp && typeof window.webSSHApp.sendToBackend === 'function') {
            const resizeMessage = {
                type: 'terminal_resize',
                data: JSON.stringify({ cols, rows }),
                timestamp: new Date().toISOString()
            };
            
            // Send resize event directly via WebSocket
            if (window.webSSHApp.directWebSocket && window.webSSHApp.directWebSocket.readyState === WebSocket.OPEN) {
                window.webSSHApp.directWebSocket.send(JSON.stringify(resizeMessage));
            }
        }
    }
    
    fitTerminal() {
        if (this.fitAddon && this.terminal) {
            try {
                const container = document.getElementById(this.containerId);
                if (container) {
                    // Use dynamic viewport units for mobile, 100% for desktop
                    if (window.innerWidth <= 600) {
                        container.style.width = '100vw';
                        container.style.height = '100dvh'; // Use dynamic viewport height for mobile
                    } else {
                        container.style.width = '100%';
                        container.style.height = '100%';
                    }
                }
                this.fitAddon.fit();
                // Terminal fitted successfully
            } catch (error) {
                console.warn('⚠️  Failed to fit terminal:', error);
            }
        }
    }
    
    adjustMobileSettings() {
        if (!this.isMobile || !this.terminal) return;

        const isPortrait = window.innerHeight > window.innerWidth;
        const screenWidth = window.innerWidth;

        let fontSize = 14;
        let lineHeight = 1.2;

        if (screenWidth <= 428) { // iPhone 13 Pro Max width
            fontSize = isPortrait ? 12 : 11;
            lineHeight = isPortrait ? 1.1 : 1.0;
        }

        // Apply settings if they changed
        this.terminal.setOption('fontSize', fontSize);
        this.terminal.setOption('lineHeight', lineHeight);

        // Refit after font size change
        setTimeout(() => this.fitTerminal(), 100);
    }
    
    showWelcomeMessage() {
        const welcomeText = [
            '\x1b[36m╭─────────────────────────────────────────────╮\x1b[0m',
            '\x1b[36m│\x1b[0m              \x1b[1m\x1b[32mWeb SSH Terminal\x1b[0m              \x1b[36m│\x1b[0m',
            '\x1b[36m│\x1b[0m         Mobile-First SSH Client           \x1b[36m│\x1b[0m',
            '\x1b[36m╰─────────────────────────────────────────────╯\x1b[0m',
            '',
            '\x1b[33m🚀 Connected to SSH server!\x1b[0m',
            '\x1b[90m💬 Real terminal session active\x1b[0m',
            '',
        ];

        welcomeText.forEach(line => {
            this.terminal.writeln(line);
        });
        
        // Don't show fake prompt - let SSH server show the real prompt
    }
    
    showError(message) {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center p-6">
                        <div class="text-red-500 text-4xl mb-4">⚠️</div>
                        <h2 class="text-xl font-bold text-red-400 mb-2">Terminal Error</h2>
                        <p class="text-gray-300 mb-4">${message}</p>
                        <button onclick="location.reload()" 
                                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            Reload
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    // Utility function for debouncing
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
    }
    
    // Public methods for external use
    write(data) {
        if (this.terminal) {
            this.terminal.write(data);
        }
    }
    
    writeln(data) {
        if (this.terminal) {
            this.terminal.writeln(data);
        }
    }
    
    clear() {
        if (this.terminal) {
            this.terminal.clear();
        }
    }
    
    focus() {
        if (this.terminal) {
            this.terminal.focus();
        }
    }
    
    getTerminal() {
        return this.terminal;
    }
    
    isReady() {
        return this.isInitialized;
    }
    
    // Terminal state management
    reset() {
        if (this.terminal) {
            this.terminal.reset();
        }
    }
    
    resize(cols, rows) {
        if (this.terminal && cols && rows) {
            this.terminal.resize(cols, rows);
        }
    }
    
    // Get terminal dimensions
    getDimensions() {
        if (this.terminal) {
            return {
                cols: this.terminal.cols,
                rows: this.terminal.rows
            };
        }
        return null;
    }
    
    // Terminal buffer utilities
    selectAll() {
        if (this.terminal) {
            this.terminal.selectAll();
        }
    }
    
    getSelection() {
        if (this.terminal) {
            return this.terminal.getSelection();
        }
        return '';
    }
}

// Global terminal instance
window.webSSHTerminal = null;

// Initialize terminal when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌐 DOM loaded, initializing terminal...');
    window.webSSHTerminal = new WebSSHTerminal('terminal-container');
});