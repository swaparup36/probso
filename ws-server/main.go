package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
	"github.com/swaparup36/pdfvid/ws-server/global"
	"github.com/swaparup36/pdfvid/ws-server/pubsub"
)

var wsUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var ctx = context.Background()

func wsHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade failed:", err)
		return
	}
	defer conn.Close()

	for {
		msgType, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}

		if msgType != websocket.TextMessage {
			continue
		}

		// convert the json message to object
		var message map[string]interface{}
		err = json.Unmarshal(msg, &message)
		if err != nil {
			log.Println("Error unmarshalling message:", err)
			continue
		}

		switch message["type"] {
		case "subscribe":
			jobId := message["jobId"].(string)

			// add to global subscribers map --> jobId maps to websocket from which I recieved the message
			sub := &global.Subscriber{
				Conn: conn, // your websocket connection
				Send: make(chan []byte, 10),
			}

			global.SubsMu.Lock()
			global.Subscribers[jobId] = sub
			global.SubsMu.Unlock()

			// writer goroutine
			go func(s *global.Subscriber, jobId string) {
				defer func() {
					s.Conn.Close()
					global.SubsMu.Lock()
					delete(global.Subscribers, jobId)
					global.SubsMu.Unlock()
				}()

				for msg := range s.Send {
					err := s.Conn.WriteMessage(websocket.TextMessage, msg)
					if err != nil {
						return
					}
				}
			}(sub, jobId)

			println("Subscriber added to jobId:", jobId)

			println("Subscriber added to jobId:", jobId)
		case "unsubscribe":
			jobId := message["jobId"].(string)

			// delete from global subscribers map --> jobId maps to websocket from which I recieved the message
			delete(global.Subscribers, jobId)
		default:
			log.Println("Unknown message type:", message["type"])
			err := conn.WriteMessage(websocket.TextMessage, []byte("Unknown message type"))
			if err != nil {
				log.Println("Error writing message to WebSocket:", err)
				return
			}
		}
	}
}

func main() {
	http.HandleFunc("/", wsHandler)

	fmt.Println("WebSocket server running on :9090")

	redisClient := pubsub.GetRedisClient()

	go listenToJobStatus(redisClient)
	go listenToJobOutput(redisClient)

	log.Fatal(http.ListenAndServe(":9090", nil))
}

func listenToJobStatus(redisClient *redis.Client) {
	subscriber := redisClient.Subscribe(ctx, "job_status_channel")
	defer subscriber.Close()

	ch := subscriber.Channel()
	for msg := range ch {
		log.Printf("Received job status update: %s", msg.Payload)

		// Get the jobId from the message payload
		var statusUpdateMsg struct {
			JobId  string `json:"jobId"`
			Status string `json:"status"`
		}
		err := json.Unmarshal([]byte(msg.Payload), &statusUpdateMsg)
		if err != nil {
			log.Printf("Error unmarshalling job status update: %v", err)
			continue
		}

		// Publish the message to the corresponding subscriber
		Publish(statusUpdateMsg.JobId, []byte(msg.Payload))
	}
}

func listenToJobOutput(redisClient *redis.Client) {
	subscriber := redisClient.Subscribe(ctx, "job_output_channel")
	println("Subscribed to job_output_channel")
	defer subscriber.Close()

	ch := subscriber.Channel()
	for msg := range ch {
		log.Printf("Received job output update payload: %s", msg.Payload)

		if !json.Valid([]byte(msg.Payload)) {
			log.Println("❌ Invalid JSON received")
			continue
		}

		// Get the jobId from the message payload
		var outputUpdateMsg struct {
			Title     string `json:"title"`
			UserId    string `json:"userId"`
			JobId     string `json:"jobId"`
			OutputUrl string `json:"output_url"`
		}
		err := json.Unmarshal([]byte(msg.Payload), &outputUpdateMsg)
		if err != nil {
			log.Printf("Error unmarshalling job output update: %v", err)
			continue
		}

		Publish(outputUpdateMsg.JobId, []byte(msg.Payload))
	}
}

func Publish(jobId string, data []byte) {
	global.SubsMu.Lock()
	sub, ok := global.Subscribers[jobId]
	global.SubsMu.Unlock()

	if !ok {
		println("Subscriber does not exist")
		return
	}

	println("Subscriber exists")
	select {
	case sub.Send <- data:
		println("data sent successfully")
		// sent successfully
	default:
		// channel full → drop or handle backpressure
	}
}
