package handler

import (
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/websocket"
)

type HandlerDeps struct {
}

// ShellSession represents a simulated shell session (TEMPORARY - will be replaced by SSH)
type ShellSession struct {
	currentInput string
	prompt       string
	conn         *websocket.Conn
}

// NewShellSession creates a new simulated shell session
func NewShellSession(conn *websocket.Conn) *ShellSession {
	return &ShellSession{
		currentInput: "",
		prompt:       "user@webssh:~$ ",
		conn:         conn,
	}
}

// HandleInput processes terminal input (basic simulation - will be replaced by SSH)
func (s *ShellSession) HandleInput(input string) {
	switch input {
	case "\r", "\n":
		// Enter pressed - process command
		s.processCommand()
	case "\u007f": // Backspace (DEL character)
		s.handleBackspace()
	default:
		// Regular character - echo and add to buffer
		if len(input) == 1 && input[0] >= 32 && input[0] <= 126 {
			s.currentInput += input
			s.sendOutput(input)
		}
	}
}

func (s *ShellSession) sendOutput(data string) {
	response := NewTerminalOutput(data, "", nil)
	if jsonData, err := response.ToJSON(); err == nil {
		s.conn.WriteMessage(websocket.TextMessage, jsonData)
	}
}

func (s *ShellSession) handleBackspace() {
	if len(s.currentInput) > 0 {
		s.currentInput = s.currentInput[:len(s.currentInput)-1]
		s.sendOutput("\b \b") // Backspace, space, backspace
	}
}

func (s *ShellSession) processCommand() {
	cmd := strings.TrimSpace(s.currentInput)
	
	// Send newline
	response := NewTerminalOutput("\r\n", "", nil)
	if data, err := response.ToJSON(); err == nil {
		s.conn.WriteMessage(websocket.TextMessage, data)
	}
	
	// Process basic commands
	s.executeCommand(cmd)
	
	// Clear input buffer
	s.currentInput = ""
	
	// Send new prompt
	s.showPrompt()
}

func (s *ShellSession) executeCommand(cmd string) {
	var output string
	
	switch {
	case cmd == "":
		// Empty command - just show prompt
		return
	case cmd == "ls":
		output = "Desktop  Documents  Downloads  Pictures  Videos\r\n"
	case cmd == "pwd":
		output = "/home/user\r\n"
	case strings.HasPrefix(cmd, "echo "):
		text := strings.TrimPrefix(cmd, "echo ")
		output = text + "\r\n"
	case cmd == "date":
		output = "Mon Aug 12 14:00:00 UTC 2025\r\n"
	case cmd == "whoami":
		output = "user\r\n"
	case cmd == "clear":
		// Send clear screen sequence
		output = "\033[2J\033[H"
	default:
		output = cmd + ": command not found\r\n"
	}
	
	if output != "" {
		response := NewTerminalOutput(output, cmd, nil)
		if data, err := response.ToJSON(); err == nil {
			s.conn.WriteMessage(websocket.TextMessage, data)
		}
	}
}

func (s *ShellSession) showPrompt() {
	response := NewTerminalOutput(s.prompt, "", nil)
	if data, err := response.ToJSON(); err == nil {
		s.conn.WriteMessage(websocket.TextMessage, data)
	}
}

func (s *ShellSession) handleRequestPrompt() {
	s.showPrompt()
}

func (h *HandlerDeps) HandleWs(upgrader websocket.Upgrader) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println(err)
			return
		}
		log.Printf("New WebSocket connection from %s", r.RemoteAddr)

		// Create shell session for this connection
		shell := NewShellSession(conn)

		// Send connection established message
		connMsg := NewConnectionStateMessage(ConnectionStateConnected, "WebSocket connection established")
		if data, err := connMsg.ToJSON(); err == nil {
			conn.WriteMessage(websocket.TextMessage, data)
		}

		log.Printf("Shell session started for %s", r.RemoteAddr)
		
		for {
			_, p, err := conn.ReadMessage()
			if err != nil {
				log.Printf("WebSocket read error: %v", err)
				return
			}

			// Parse incoming message
			msg, err := ParseMessage(p)
			if err != nil {
				log.Printf("Invalid message format: %v", err)
				errMsg := NewSystemMessage("Invalid message format")
				if data, err := errMsg.ToJSON(); err == nil {
					conn.WriteMessage(websocket.TextMessage, data)
				}
				continue
			}

			// Handle different message types
			switch msg.Type {
			case MessageTypeTerminalInput:
				// Handle terminal input through shell session
				shell.HandleInput(msg.Data)
			case MessageTypeRequestPrompt:
				// Frontend requesting initial prompt
				shell.handleRequestPrompt()
			default:
				log.Printf("Unhandled message type: %s", msg.Type)
			}
		}
	}
}

