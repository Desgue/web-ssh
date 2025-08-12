package config

import (
	"errors"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"time"
)

const (
	DefaultPort            = "3000"
	DefaultFrontendDir     = "frontend"
	DefaultReadTimeout     = 30 * time.Second
	DefaultWriteTimeout    = 30 * time.Second
	DefaultMaxConnections  = 100
	DefaultReadBufferSize  = 1024
	DefaultWriteBufferSize = 1024
)

var (
	ErrInvalidPort           = errors.New("invalid port number, must be greater than 0 and must be a string")
	ErrInvalidDir            = errors.New("invalid frontend directory, cannot be empty")
	ErrInvalidTimeout        = errors.New("invalid timeout, must be greater than 0")
	ErrInvalidMaxConnections = errors.New("invalid max connections, must be greater than 0")
	ErrInvalidConfig         = errors.New("invalid configuration, please check your settings")
)

type Server struct {
	Port            string        `json:"port"`
	FrontendDir     FrontendDir   `json:"frontend_dir"`
	ReadTimeout     time.Duration `json:"read_timeout"`
	WriteTimeout    time.Duration `json:"write_timeout"`
	MaxConnections  int           `json:"max_connections"`
	ReadBufferSize  int           `json:"read_buffer_size"`
	WriteBufferSize int           `json:"write_buffer_size"`
}

func NewServer() *Server {
	// get all fields from the environment variables
	port := os.Getenv("WEB_SSH_PORT")
	if port == "" {
		port = DefaultPort
	}
	frontendDir := os.Getenv("WEB_SSH_FRONTEND_DIR")
	if frontendDir == "" {
		frontendDir = DefaultFrontendDir
	}
	readTimeout := os.Getenv("WEB_SSH_READ_TIMEOUT")
	if readTimeout == "" {
		readTimeout = DefaultReadTimeout.String()
	}
	writeTimeout := os.Getenv("WEB_SSH_WRITE_TIMEOUT")
	if writeTimeout == "" {
		writeTimeout = DefaultWriteTimeout.String()
	}
	maxConnections := os.Getenv("WEB_SSH_MAX_CONNECTIONS")
	if maxConnections == "" {
		maxConnections = strconv.Itoa(DefaultMaxConnections)
	}
	readBufferSize := os.Getenv("WEB_SSH_READ_BUFFER_SIZE")
	if readBufferSize == "" {
		readBufferSize = strconv.Itoa(DefaultReadBufferSize)
	}
	writeBufferSize := os.Getenv("WEB_SSH_WRITE_BUFFER_SIZE")
	if writeBufferSize == "" {
		writeBufferSize = strconv.Itoa(DefaultWriteBufferSize)
	}

	return &Server{
		Port:            port,
		FrontendDir:     FrontendDir(frontendDir),
		ReadTimeout:     parseDuration(readTimeout, DefaultReadTimeout),
		WriteTimeout:    parseDuration(writeTimeout, DefaultWriteTimeout),
		MaxConnections:  parseInt(maxConnections, DefaultMaxConnections),
		ReadBufferSize:  parseInt(readBufferSize, DefaultReadBufferSize),
		WriteBufferSize: parseInt(writeBufferSize, DefaultWriteBufferSize),
	}
}

func (s *Server) Validate() error {

	port, err := strconv.Atoi(s.Port)
	if err != nil {
		return errors.Join(ErrInvalidConfig, ErrInvalidPort)
	}

	if port <= 0 {
		return errors.Join(ErrInvalidConfig, ErrInvalidPort)
	}
	if s.ReadTimeout <= 0 {
		return errors.Join(ErrInvalidConfig, ErrInvalidTimeout)
	}
	if s.WriteTimeout <= 0 {
		return errors.Join(ErrInvalidConfig, ErrInvalidTimeout)
	}
	if s.MaxConnections <= 0 {
		return errors.Join(ErrInvalidConfig, ErrInvalidMaxConnections)
	}

	if s.FrontendDir == "" {
		return errors.Join(ErrInvalidConfig, ErrInvalidDir)
	}
	if err := s.FrontendDir.Build(); err != nil {
		return errors.Join(ErrInvalidConfig, ErrInvalidDir, err)
	}
	return nil
}

func (s *Server) SetDefaults() {
	log.Println("Setting default configuration values")
	s.Port = DefaultPort
	s.ReadTimeout = DefaultReadTimeout
	s.WriteTimeout = DefaultWriteTimeout
	s.MaxConnections = DefaultMaxConnections
	s.ReadBufferSize = DefaultReadBufferSize
	s.WriteBufferSize = DefaultWriteBufferSize
	s.FrontendDir = FrontendDir(DefaultFrontendDir)

}

type FrontendDir string

func (f *FrontendDir) String() string {
	return string(*f)
}

func (f *FrontendDir) Build() error {
	// If already absolute, use as is
	if filepath.IsAbs(string(*f)) {
		// Check if frontend directory exists
		if _, err := os.Stat(string(*f)); os.IsNotExist(err) {
			log.Fatal("Frontend directory does not exist:", string(*f))
		}
		return nil
	}

	// Otherwise, join with working directory
	wd, err := os.Getwd()
	if err != nil {
		log.Fatal("Failed to get working directory:", err)
	}

	*f = FrontendDir(filepath.Join(wd, "..", string(*f)))

	// Check if frontend directory exists
	if _, err := os.Stat(string(*f)); os.IsNotExist(err) {
		log.Fatal("Frontend directory does not exist:", string(*f))
	}
	return nil
}

// Helpers

func parseDuration(value string, defaultValue time.Duration) time.Duration {
	if value == "" {
		return defaultValue
	}
	duration, err := time.ParseDuration(value)
	if err != nil || duration <= 0 {
		log.Printf("Invalid duration value '%s', using default: %s", value, defaultValue)
		return defaultValue
	}
	return duration
}
func parseInt(value string, defaultValue int) int {
	if value == "" {
		return defaultValue
	}
	intValue, err := strconv.Atoi(value)
	if err != nil || intValue <= 0 {
		log.Printf("Invalid integer value '%s', using default: %d", value, defaultValue)
		return defaultValue
	}
	return intValue
}
