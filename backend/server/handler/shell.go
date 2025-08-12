package handler

import (
	"errors"
	"io"
	"log"

	"github.com/gorilla/websocket"
	"golang.org/x/crypto/ssh"
)

var (
	ErrConnectionFailed = errors.New("Connection failed")
	ErrSessionFailed    = errors.New("Session creation failed")
	ErrPTYRequestFailed = errors.New("PTY request failed")
	ErrInvalidMessage   = errors.New("Invalid message format")
)

// ShellConnection represents a simulated shell session (TEMPORARY - will be replaced by SSH)
type ShellConnection struct {
	conn       *websocket.Conn
	sshClient  *ssh.Client
	session    *ssh.Session
	stdinPipe  io.WriteCloser
	stdoutPipe io.Reader
	stderrPipe io.Reader
}

// NewShellConnection creates a new simulated shell session
func NewShellConnection(conn *websocket.Conn) *ShellConnection {
	return &ShellConnection{
		conn: conn,
	}
}
func (s *ShellConnection) Connect(metadata *MessageMetadata) error {
	sshConfig := &ssh.ClientConfig{
		User: metadata.SSHUser,
		Auth: []ssh.AuthMethod{
			ssh.Password(metadata.SSHPassword),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), // TODO: replace for prod
	}

	client, err := ssh.Dial("tcp", "target-server:22", sshConfig)
	if err != nil {
		log.Println("SSH dial error:", err)
		return errors.Join(err, ErrConnectionFailed)
	}
	s.sshClient = client

	session, err := client.NewSession()
	if err != nil {
		log.Println("SSH session error:", err)
		return errors.Join(err, ErrSessionFailed)
	}
	s.session = session

	// Request PTY so terminal behaves correctly
	modes := ssh.TerminalModes{
		ssh.ECHO:          1,     // Enable echo
		ssh.TTY_OP_ISPEED: 14400, // Input speed = 14.4kbaud
		ssh.TTY_OP_OSPEED: 14400, // Output speed = 14.4kbaud
	}
	if err := session.RequestPty("xterm", 24, 80, modes); err != nil {
		log.Println("PTY request failed:", err)
		return errors.Join(err, ErrPTYRequestFailed)
	}

	s.stdinPipe, _ = session.StdinPipe()
	s.stdoutPipe, _ = session.StdoutPipe()
	s.stderrPipe, _ = session.StderrPipe()

	if err := session.Shell(); err != nil {
		return errors.Join(err, ErrSessionFailed)
	}
	return nil

}

func (s *ShellConnection) Close() error {
	if s.session != nil {
		if err := s.session.Close(); err != nil {
			log.Println("Failed to close SSH session:", err)
		}
	}
	if s.sshClient != nil {
		if err := s.sshClient.Close(); err != nil {
			log.Println("Failed to close SSH client:", err)
		}
	}
	return nil
}

// // HandleInput processes terminal input (basic simulation - will be replaced by SSH)
// func (s *ShellConnection) HandleInput(input string) {
// 	switch input {
// 	case "\r", "\n":
// 		// Enter pressed - process command
// 		s.processCommand()
// 	case "\u007f": // Backspace (DEL character)
// 		s.handleBackspace()
// 	default:
// 		// Regular character - echo and add to buffer
// 		if len(input) == 1 && input[0] >= 32 && input[0] <= 126 {
// 			s.currentInput += input
// 			s.sendOutput(input)
// 		}
// 	}
// }

// func (s *ShellConnection) sendOutput(data string) {
// 	response := NewTerminalOutput(data, "", nil)
// 	if jsonData, err := response.ToJSON(); err == nil {
// 		s.conn.WriteMessage(websocket.TextMessage, jsonData)
// 	}
// }

// func (s *ShellConnection) handleBackspace() {
// 	if len(s.currentInput) > 0 {
// 		s.currentInput = s.currentInput[:len(s.currentInput)-1]
// 		s.sendOutput("\b \b") // Backspace, space, backspace
// 	}
// }

// func (s *ShellConnection) processCommand() {
// 	cmd := strings.TrimSpace(s.currentInput)

// 	// Send newline
// 	response := NewTerminalOutput("\r\n", "", nil)
// 	if data, err := response.ToJSON(); err == nil {
// 		s.conn.WriteMessage(websocket.TextMessage, data)
// 	}

// 	// Process basic commands
// 	s.executeCommand(cmd)

// 	// Clear input buffer
// 	s.currentInput = ""

// 	// Send new prompt
// 	s.showPrompt()
// }

// func (s *ShellConnection) executeCommand(cmd string) {
// 	var output string

// 	switch {
// 	case cmd == "":
// 		// Empty command - just show prompt
// 		return
// 	case cmd == "ls":
// 		output = "Desktop  Documents  Downloads  Pictures  Videos\r\n"
// 	case cmd == "pwd":
// 		output = "/home/user\r\n"
// 	case strings.HasPrefix(cmd, "echo "):
// 		text := strings.TrimPrefix(cmd, "echo ")
// 		output = text + "\r\n"
// 	case cmd == "date":
// 		output = "Mon Aug 12 14:00:00 UTC 2025\r\n"
// 	case cmd == "whoami":
// 		output = "user\r\n"
// 	case cmd == "clear":
// 		// Send clear screen sequence
// 		output = "\033[2J\033[H"
// 	default:
// 		output = cmd + ": command not found\r\n"
// 	}

// 	if output != "" {
// 		response := NewTerminalOutput(output, cmd, nil)
// 		if data, err := response.ToJSON(); err == nil {
// 			s.conn.WriteMessage(websocket.TextMessage, data)
// 		}
// 	}
// }

// func (s *ShellConnection) showPrompt() {
// 	response := NewTerminalOutput(s.prompt, "", nil)
// 	if data, err := response.ToJSON(); err == nil {
// 		s.conn.WriteMessage(websocket.TextMessage, data)
// 	}
// }

// func (s *ShellConnection) handleRequestPrompt() {
// 	s.showPrompt()
// }
