package handler

import (
	"log"
	"net/http"
)

// logRequests is a simple logging middleware
func LogRequests(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s %s", r.RemoteAddr, r.Method, r.URL.Path)
		handler.ServeHTTP(w, r)
	})
}
