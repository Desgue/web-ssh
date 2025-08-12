# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **web-based SSH client** designed as a mobile-first terminal experience. The project implements a secure SSH proxy bridge that allows users to access SSH servers through a browser interface, optimized for mobile devices like iPhone and tablets.

### Architecture

The project follows a three-tier architecture:

1. **Frontend**: HTMX + Tailwind CSS + xterm.js terminal emulator with WebSocket communication
2. **Backend**: Go-based SSH proxy server with security middleware chain and WebSocket handling  
3. **Infrastructure**: Docker Compose and Kubernetes deployment configurations

```
frontend/     # Mobile-first web interface with HTMX and xterm.js
backend/      # Go SSH proxy server with security middleware
infra/        # Docker Compose and Kubernetes deployment files
```

## Development Commands

### Backend (Go)

The backend is a Go module using Go 1.24.5:

```bash
# Navigate to backend directory
cd backend/

# Initialize/update dependencies
go mod tidy

# Run the application
go run .

# Build the application
go build -o web-ssh-client

# Run tests (when available)
go test ./...

# Format code
go fmt ./...

# Vet code for issues
go vet ./...
```

### Frontend Development

The frontend uses HTMX, Tailwind CSS, and xterm.js. Based on the requirements documentation:

```bash
cd frontend/

# Development server (implementation dependent)
# Check for package.json or similar build configuration

# For static files, serve via HTTP server
python3 -m http.server 8000
# or
npx serve .
```

### Infrastructure

```bash
cd infra/

# Docker Compose development
docker-compose up -d

# Docker Compose production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f web-ssh-client

# Cleanup
docker-compose down -v

# Kubernetes deployment
kubectl apply -f k8s/
kubectl get all -n web-ssh-client
kubectl logs -f deployment/ssh-client-deployment -n web-ssh-client
```

## Key Architecture Components

### Security Middleware Chain (Backend)

The backend implements a comprehensive security middleware chain:

1. **IP Validation Middleware** - IP allow/block lists with malicious detection
2. **API Key Middleware** - Single API key authentication model
3. **Rate Limiting Middleware** - Redis-based rate limiting with configurable limits
4. **Command Filter Middleware** - Blacklist dangerous SSH commands before execution
5. **Response Filter Middleware** - Sanitize SSH responses for sensitive data

### WebSocket Communication

- **Message Types**: `terminal_input`, `terminal_output`, `system_message`, `connection_state`
- **Real-time bidirectional** communication between browser and SSH sessions
- **Connection management** with retry logic and reconnection handling

### Responsive Design

The frontend follows a mobile-first responsive design approach:
- **Mobile-first**: Optimized primarily for mobile devices (iPhone, Android tablets)
- **Responsive**: Adapts seamlessly to all screen sizes from mobile to desktop
- **iPhone 13 Pro Max reference**: 428 × 926 pixels (390 × 844 logical)
- **Safe area handling**: Support for notch, home indicator, and device-specific UI elements
- **Touch-optimized**: Terminal interactions designed for touch interfaces with virtual keyboard support
- **Desktop compatibility**: Fully functional on desktop browsers with keyboard and mouse input

## Configuration

### Environment Variables

Required variables for backend:
- `API_KEY` - Single API key for authentication
- `REDIS_URL` - Redis connection string (e.g., `redis://redis:6379/0`)
- `PORT` - Application port (default: 8080)

Optional security variables:
- `ALLOWED_IPS` - Comma-separated allowed IP addresses/ranges
- `BLOCKED_IPS` - Comma-separated blocked IP addresses
- `RATE_LIMIT_CONNECTIONS` - Max WebSocket connections per IP per minute
- `RATE_LIMIT_MESSAGES` - Max messages per WebSocket per second

### Dependencies

- **Backend**: Go 1.24.5, Redis for rate limiting and caching
- **Frontend**: HTMX, Tailwind CSS, xterm.js terminal emulator
- **Infrastructure**: Docker, Kubernetes, Nginx for reverse proxy

## Security Considerations

This project implements multiple security layers:

- **API Key Authentication** - Single key model with session-based access
- **Command Filtering** - Blocks dangerous system commands (rm, dd, mkfs, etc.)
- **Response Sanitization** - Removes sensitive data from SSH output  
- **IP-based Security** - Allow/block lists with malicious behavior detection
- **Rate Limiting** - Prevents abuse and DoS attacks
- **Input Validation** - All WebSocket messages validated and sanitized

## Data Handling

- **Zero Data Retention** - No terminal session data stored permanently
- **In-Memory Processing** - All data processing happens in memory
- **Redis Usage** - Only for rate limiting counters and temporary caching
- **Session Cleanup** - Automatic cleanup on client disconnect

## Testing & Development

Currently, this appears to be in early development phase with primarily documentation. When implementing:

1. **Backend Testing**: Use Go's built-in testing framework
2. **Frontend Testing**: Manual testing across mobile devices and desktop browsers for responsive compatibility
3. **Integration Testing**: WebSocket communication between frontend and backend
4. **Security Testing**: Test all middleware components and rate limiting

The project emphasizes mobile-first SSH access through a browser, providing a secure and user-friendly alternative to traditional SSH clients on mobile devices.