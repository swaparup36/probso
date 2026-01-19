# Builder stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o ws-server ./main.go

# Runner stage
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/ws-server .

EXPOSE 9090

CMD ["./ws-server"]