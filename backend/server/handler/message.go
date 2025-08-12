package handler

import (
	"encoding/json"
	"regexp"
	"time"
)

type MessageType string

const (
	MessageTypeTerminalInput   MessageType = "terminal_input"
	MessageTypeTerminalOutput  MessageType = "terminal_output"
	MessageTypeTerminalError   MessageType = "terminal_error"
	MessageTypeSystemMessage   MessageType = "system_message"
	MessageTypeConnectionState MessageType = "connection_state"
	MessageTypeRequestPrompt   MessageType = "request_prompt"
)

type Message struct {
	Type      MessageType `json:"type"`
	Data      string      `json:"data"`
	Timestamp time.Time   `json:"timestamp"`
	// Optional metadata for enhanced terminal handling
	Metadata  *MessageMetadata `json:"metadata,omitempty"`
}

type MessageMetadata struct {
	// For terminal output
	HasAnsi     bool   `json:"has_ansi,omitempty"`     // Whether data contains ANSI escape codes
	ExitCode    *int   `json:"exit_code,omitempty"`    // Command exit code (for terminal_output)
	Command     string `json:"command,omitempty"`      // Original command (for reference)
	
	// For SSH connection
	SSHHost     string `json:"ssh_host,omitempty"`     // SSH server hostname
	SSHUser     string `json:"ssh_user,omitempty"`     // SSH username
	SessionID   string `json:"session_id,omitempty"`   // Unique session identifier
}

type ConnectionState string

const (
	ConnectionStateConnected    ConnectionState = "connected"
	ConnectionStateDisconnected ConnectionState = "disconnected"
	ConnectionStateConnecting   ConnectionState = "connecting"
	ConnectionStateError        ConnectionState = "error"
)

type ConnectionStateMessage struct {
	State   ConnectionState `json:"state"`
	Message string          `json:"message,omitempty"`
}

func NewMessage(msgType MessageType, data string) *Message {
	return &Message{
		Type:      msgType,
		Data:      data,
		Timestamp: time.Now(),
	}
}

func NewSystemMessage(message string) *Message {
	return NewMessage(MessageTypeSystemMessage, message)
}

func NewTerminalError(errorMsg string) *Message {
	return NewMessage(MessageTypeTerminalError, errorMsg)
}

// NewTerminalOutput creates a terminal output message with ANSI detection
func NewTerminalOutput(output string, command string, exitCode *int) *Message {
	msg := NewMessage(MessageTypeTerminalOutput, output)
	
	// Detect ANSI escape codes
	hasAnsi := containsAnsiCodes(output)
	
	msg.Metadata = &MessageMetadata{
		HasAnsi:  hasAnsi,
		Command:  command,
		ExitCode: exitCode,
	}
	
	return msg
}

// NewSSHTerminalOutput creates a terminal output message for SSH commands
func NewSSHTerminalOutput(output string, command string, exitCode *int, sshHost string, sshUser string, sessionID string) *Message {
	msg := NewTerminalOutput(output, command, exitCode)
	
	if msg.Metadata == nil {
		msg.Metadata = &MessageMetadata{}
	}
	
	msg.Metadata.SSHHost = sshHost
	msg.Metadata.SSHUser = sshUser
	msg.Metadata.SessionID = sessionID
	
	return msg
}

// containsAnsiCodes checks if a string contains ANSI escape sequences
func containsAnsiCodes(s string) bool {
	// Match ANSI escape sequences: ESC[ followed by parameters and command
	ansiRegex := regexp.MustCompile(`\x1b\[[0-9;]*[mK]`)
	return ansiRegex.MatchString(s)
}

func NewConnectionStateMessage(state ConnectionState, message string) *Message {
	stateData := ConnectionStateMessage{
		State:   state,
		Message: message,
	}
	data, _ := json.Marshal(stateData)
	return NewMessage(MessageTypeConnectionState, string(data))
}

func (m *Message) ToJSON() ([]byte, error) {
	return json.Marshal(m)
}

func ParseMessage(data []byte) (*Message, error) {
	var msg Message
	err := json.Unmarshal(data, &msg)
	return &msg, err
}