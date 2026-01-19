package global

import (
	"sync"

	"github.com/gorilla/websocket"
)

type Subscriber struct {
	Conn *websocket.Conn
	Send chan []byte
}

var Subscribers = make(map[string]*Subscriber)
var SubsMu sync.Mutex
