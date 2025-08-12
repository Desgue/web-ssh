package handler

import (
	"errors"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var (
	ErrInvalidMessageFormat = errors.New("Invalid message format")
)

type Connection struct {
}

func (h *Connection) HandleWs(upgrader websocket.Upgrader) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println(err)
			return
		}
		log.Printf("New WebSocket connection from %s", r.RemoteAddr)
		defer conn.Close()

		shell := NewShellConnection(conn)
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

			// Handle message types
			switch msg.Type {

			// Handle connection request (e.g., SSH)
			case MessageTypeConnectionRequest:
				if err := handleConnectionRequest(msg, conn, shell); err != nil {
					log.Printf("Failed to handle connection request: %s", err)
					errMsg := NewSystemMessage("Failed to handle connection request")
					if data, err := errMsg.ToJSON(); err == nil {
						conn.WriteMessage(websocket.TextMessage, data)
					}
					continue
				}

			default:
				log.Printf("Unhandled message type: %s", msg.Type)
			}
		}
	}
}

func handleConnectionRequest(msg *Message, conn *websocket.Conn, shell *ShellConnection) error {
	if msg.Metadata != nil {
		err := shell.Connect(msg.Metadata)
		if err != nil {
			return err
		}

		log.Printf("Shell session connected for %s", msg.Metadata.SSHUser)
		connMsg := NewConnectionStateMessage(ConnectionStateConnected, "Shell session connected")
		data, err := connMsg.ToJSON()
		if err != nil {
			return err
		}
		if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
			return err
		}
	} else {
		log.Println("Connection request missing metadata")
		return ErrInvalidMessageFormat
	}

	return nil
}
