package server

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/Desgue/web-ssh/config"
	"github.com/Desgue/web-ssh/server/handler"
	"github.com/gorilla/websocket"
)

type Server struct {
	Port        string
	FrontendDir string
	Upgrader    *websocket.Upgrader
	done        chan struct{}
	server      *http.Server // for graceful shutdown
}

func New(cfg config.Server) *Server {
	if err := cfg.Validate(); err != nil {
		log.Printf("Invalid configuration:%s", err)
		cfg.SetDefaults()
	}

	handlerDeps := new(handler.Connection)

	mux := newMux(cfg, handlerDeps)

	addr := ":" + cfg.Port
	return &Server{
		Port:        cfg.Port,
		FrontendDir: cfg.FrontendDir.String(),
		Upgrader: &websocket.Upgrader{
			CheckOrigin:     func(r *http.Request) bool { return true },
			ReadBufferSize:  cfg.ReadBufferSize,
			WriteBufferSize: cfg.WriteBufferSize,
		},
		done: make(chan struct{}),
		server: &http.Server{
			Addr:    addr,
			Handler: handler.LogRequests(mux),
		},
	}
}

func newMux(cfg config.Server, handlerDeps *handler.Connection) *http.ServeMux {
	mux := http.NewServeMux()
	fs := http.FileServer(http.Dir(cfg.FrontendDir.String()))
	mux.Handle("/", fs)
	mux.Handle("/ws", handlerDeps.HandleWs(websocket.Upgrader{
		CheckOrigin:     func(r *http.Request) bool { return true },
		ReadBufferSize:  cfg.ReadBufferSize,
		WriteBufferSize: cfg.WriteBufferSize,
	}))
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, `{"status": "healthy", "port": "%s"}`, cfg.Port)
	})
	return mux
}

func (s *Server) Start() {
	log.Printf("🚀 Web SSH Client Server starting on port %s", s.Port)
	log.Printf("📁 Serving static files from: %s", s.FrontendDir)
	log.Printf("🌐 Open your browser at: http://localhost:%s", s.Port)
	log.Printf("📱 Mobile optimized for iPhone 13 Pro Max")

	go func() {
		if err := s.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("ListenAndServe failed: %v", err)
		}
		s.done <- struct{}{}
		log.Println("Server stopped")
	}()
}

func (s *Server) Shutdown(ctx context.Context) error {
	log.Println("Shutting down server...")
	return s.server.Shutdown(ctx)
}

func (s *Server) Done() <-chan struct{} {
	return s.done
}
