/**
 * Mobile.js - Mobile-specific keyboard handling and touch optimization
 * Implements chat-app-style keyboard behavior for mobile devices
 */

class MobileKeyboardHandler {
    constructor(terminal) {
        this.terminal = terminal;
        this.hiddenInput = null;
        this.isMobile = this.detectMobile();
        this.isKeyboardVisible = false;
        this.lastInputTime = 0;
        this.inputBuffer = '';
        
        if (this.isMobile) {
            this.setupMobileKeyboard();
            this.setupTouchHandling();
            console.log('📱 Mobile keyboard handler initialized');
        }
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               'ontouchstart' in window || 
               navigator.maxTouchPoints > 0;
    }
    
    setupMobileKeyboard() {
        // Get or create hidden input
        this.hiddenInput = document.getElementById('mobile-input');
        if (!this.hiddenInput) {
            this.createHiddenInput();
        }
        
        // Configure hidden input for mobile keyboard optimization
        this.configureHiddenInput();
        
        // Set up event listeners
        this.setupInputListeners();
        
        console.log('⌨️  Mobile keyboard setup complete');
    }
    
    createHiddenInput() {
        this.hiddenInput = document.createElement('input');
        this.hiddenInput.type = 'text';
        this.hiddenInput.id = 'mobile-input';
        this.hiddenInput.className = 'absolute left-[-9999px] opacity-0';
        this.hiddenInput.setAttribute('aria-hidden', 'true');
        document.body.appendChild(this.hiddenInput);
    }
    
    configureHiddenInput() {
        const input = this.hiddenInput;
        
        // Disable autocomplete and suggestions
        input.autocomplete = 'off';
        input.autocorrect = 'off';
        input.autocapitalize = 'off';
        input.spellcheck = false;
        
        // Set input attributes for better mobile keyboard
        input.inputMode = 'text';
        input.enterKeyHint = 'enter';
        
        // Prevent zoom on focus (iOS)
        input.style.fontSize = '16px';
        input.style.minHeight = '44px'; // iOS minimum touch target
        
        console.log('🔧 Hidden input configured for mobile optimization');
    }
    
    setupInputListeners() {
        const input = this.hiddenInput;
        
        // Handle input events (character typing)
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            
            if (value && this.terminal) {
                // Handle the new input
                this.handleMobileInput(value);
                // Clear the input field
                input.value = '';
            }
        });
        
        // Handle special keys
        input.addEventListener('keydown', (e) => {
            
            switch (e.key) {
                case 'Enter':
                    e.preventDefault();
                    this.sendInput('\r');
                    break;
                    
                case 'Backspace':
                    e.preventDefault();
                    this.sendInput('\b');
                    break;
                    
                case 'Tab':
                    e.preventDefault();
                    this.sendInput('\t');
                    break;
                    
                case 'Escape':
                    e.preventDefault();
                    this.sendInput('\x1b');
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    this.sendInput('\x1b[A');
                    break;
                    
                case 'ArrowDown':
                    e.preventDefault();
                    this.sendInput('\x1b[B');
                    break;
                    
                case 'ArrowRight':
                    e.preventDefault();
                    this.sendInput('\x1b[C');
                    break;
                    
                case 'ArrowLeft':
                    e.preventDefault();
                    this.sendInput('\x1b[D');
                    break;
            }
        });
        
        // Handle focus events
        input.addEventListener('focus', () => {
            this.isKeyboardVisible = true;
            this.updateKeyboardStatus(true);
        });
        
        input.addEventListener('blur', () => {
            this.isKeyboardVisible = false;
            this.updateKeyboardStatus(false);
        });
        
        // Handle composition events (for complex input methods)
        input.addEventListener('compositionstart', () => {
            // Composition started
        });
        
        input.addEventListener('compositionend', (e) => {
            if (e.data) {
                this.sendInput(e.data);
            }
        });
    }
    
    setupTouchHandling() {
        const terminalContainer = document.getElementById('terminal-container');
        
        if (!terminalContainer) {
            console.warn('⚠️  Terminal container not found for touch handling');
            return;
        }
        
        // Handle touch events to show mobile keyboard
        terminalContainer.addEventListener('touchstart', (e) => {
            this.focusMobileInput();
        });
        
        // Handle click events (for desktop/tablet with mouse)
        terminalContainer.addEventListener('click', (e) => {
            this.focusMobileInput();
        });
        
        // Prevent zoom on double tap
        terminalContainer.addEventListener('touchend', (e) => {
            if (e.touches.length === 0) {
                e.preventDefault();
            }
        });
        
        // Handle long press for context menu (future feature)
        let longPressTimer;
        terminalContainer.addEventListener('touchstart', (e) => {
            longPressTimer = setTimeout(() => {
                // Future: show context menu
            }, 500);
        });
        
        terminalContainer.addEventListener('touchend', () => {
            clearTimeout(longPressTimer);
        });
        
        terminalContainer.addEventListener('touchmove', () => {
            clearTimeout(longPressTimer);
        });
        
        console.log('👆 Touch handling setup complete');
    }
    
    handleMobileInput(value) {
        // Send each character individually to maintain proper terminal behavior
        for (let i = 0; i < value.length; i++) {
            const char = value[i];
            this.sendInput(char);
        }
    }
    
    sendInput(data) {
        if (!this.terminal || !this.terminal.getTerminal()) {
            return;
        }
        
        // Use proper public API - trigger input through terminal's handler
        if (this.terminal.handleTerminalInput) {
            this.terminal.handleTerminalInput(data);
        } else {
            // Fallback to proper onData trigger
            const terminal = this.terminal.getTerminal();
            if (terminal && terminal.onData) {
                terminal.onData(data);
            }
        }
    }
    
    focusMobileInput() {
        if (!this.isMobile || !this.hiddenInput) {
            return;
        }
        
        // Focus the hidden input to show mobile keyboard
        try {
            this.hiddenInput.focus();
        } catch (error) {
            console.warn('⚠️  Failed to focus mobile input:', error);
        }
    }
    
    updateKeyboardStatus(visible) {
        const statusElement = document.querySelector('#connection-status span');
        if (statusElement) {
            if (visible) {
                statusElement.textContent = 'Typing...';
            } else {
                statusElement.textContent = 'Ready';
            }
        }
        
        // Adjust terminal layout for keyboard
        if (visible) {
            this.adjustForVirtualKeyboard();
        } else {
            this.resetLayoutAfterKeyboard();
        }
    }
    
    adjustForVirtualKeyboard() {
        // Add class to body for CSS adjustments
        document.body.classList.add('virtual-keyboard-visible');
        
        // Fit terminal after keyboard adjustment
        setTimeout(() => {
            if (this.terminal && this.terminal.fitTerminal) {
                this.terminal.fitTerminal();
            }
        }, 300);
        
        console.log('⌨️  Adjusted layout for virtual keyboard');
    }
    
    resetLayoutAfterKeyboard() {
        // Remove class from body
        document.body.classList.remove('virtual-keyboard-visible');
        
        // Fit terminal after keyboard closes
        setTimeout(() => {
            if (this.terminal && this.terminal.fitTerminal) {
                this.terminal.fitTerminal();
            }
        }, 300);
        
        console.log('⌨️  Reset layout after virtual keyboard');
    }
    
    // Public methods
    isKeyboardOpen() {
        return this.isKeyboardVisible;
    }
    
    dismissKeyboard() {
        if (this.hiddenInput) {
            this.hiddenInput.blur();
        }
    }
    
    showKeyboard() {
        this.focusMobileInput();
    }
}

// Additional mobile optimizations
class MobileOptimizations {
    constructor() {
        this.setupViewportHandling();
        this.setupOrientationHandling();
        this.setupPerformanceOptimizations();
    }
    
    setupViewportHandling() {
        // Handle viewport changes for mobile browsers
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        
        // Prevent zoom on form inputs
        document.addEventListener('touchstart', () => {
            if (viewportMeta) {
                viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover';
            }
        });
        
        // Visual viewport API support (modern browsers)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                // Notify terminal to refit
                if (window.webSSHTerminal) {
                    setTimeout(() => window.webSSHTerminal.fitTerminal(), 100);
                }
            });
        }
    }
    
    setupOrientationHandling() {
        // Handle orientation changes smoothly
        window.addEventListener('orientationchange', () => {
            console.log('🔄 Orientation changed');
            
            // Hide keyboard on orientation change
            const activeElement = document.activeElement;
            if (activeElement && activeElement.tagName === 'INPUT') {
                activeElement.blur();
            }
            
            // Refit terminal after orientation stabilizes
            setTimeout(() => {
                if (window.webSSHTerminal) {
                    window.webSSHTerminal.fitTerminal();
                }
            }, 500);
        });
    }
    
    setupPerformanceOptimizations() {
        // Prevent default behavior on certain touch events for better performance
        document.addEventListener('touchmove', (e) => {
            // Only prevent default on terminal container to allow scrolling elsewhere
            if (e.target.closest('#terminal-container')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Optimize scrolling performance
        const terminalContainer = document.getElementById('terminal-container');
        if (terminalContainer) {
            terminalContainer.style.webkitOverflowScrolling = 'touch';
        }
    }
}

// Global mobile handler instances
window.mobileKeyboardHandler = null;
window.mobileOptimizations = null;

// Initialize mobile features when terminal is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize mobile optimizations immediately
    window.mobileOptimizations = new MobileOptimizations();
    
    // Wait for terminal to be ready, then initialize mobile keyboard handler
    const checkTerminal = () => {
        if (window.webSSHTerminal && window.webSSHTerminal.isReady()) {
            window.mobileKeyboardHandler = new MobileKeyboardHandler(window.webSSHTerminal);
            console.log('📱 Mobile features initialized');
        } else {
            setTimeout(checkTerminal, 100);
        }
    };
    
    setTimeout(checkTerminal, 500); // Give terminal time to initialize
});