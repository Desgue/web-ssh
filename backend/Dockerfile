# Build stage
FROM golang:1.24.5-alpine AS builder

WORKDIR /app

# Install ca-certificates for SSL/TLS
RUN apk add --no-cache ca-certificates

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o web-ssh-client .

# Runtime stage
FROM alpine:3.19

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Install ca-certificates for SSL/TLS
RUN apk add --no-cache ca-certificates

WORKDIR /app

# Copy ca-certificates from builder
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy the built application
COPY --from=builder /app/web-ssh-client .

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

EXPOSE 3000

CMD ["./web-ssh-client"]