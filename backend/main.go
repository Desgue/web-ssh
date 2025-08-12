package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/Desgue/web-ssh/config"
	"github.com/Desgue/web-ssh/server"
)

func main() {
	serverCfg := config.NewServer()
	srv := server.New(*serverCfg)

	srv.Start()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	select {
	case <-quit:
		log.Println("Received shutdown signal")
		srv.Shutdown(context.Background())
	case <-srv.Done():
		log.Println("Server shutdown completed")
	}
}
