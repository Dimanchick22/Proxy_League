package websocket

import (
	"log"
	"sync"
	"time"
)

type Hub struct {
	clients    map[*Client]bool
	Broadcast  chan *Message
	Register   chan *Client
	Unregister chan *Client
	rooms      map[uint]map[*Client]bool
	mutex      sync.RWMutex
}

type Message struct {
	Type      string      `json:"type"`
	RoomID    *uint       `json:"room_id,omitempty"`
	UserID    uint        `json:"user_id"`
	Username  string      `json:"username"`
	Avatar    string      `json:"avatar,omitempty"`
	Content   string      `json:"content"`
	CreatedAt time.Time   `json:"created_at"`
	Data      interface{} `json:"data,omitempty"`
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		Broadcast:  make(chan *Message),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		rooms:      make(map[uint]map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mutex.Lock()
			h.clients[client] = true
			h.mutex.Unlock()
			log.Printf("Client registered: %s (User ID: %d)", client.Username, client.UserID)

			h.broadcastMessage(&Message{
				Type:      "user_joined",
				UserID:    client.UserID,
				Username:  client.Username,
				Avatar:    client.Avatar,
				Content:   client.Username + " joined the chat",
				CreatedAt: time.Now(),
			})

		case client := <-h.Unregister:
			h.mutex.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)

				for roomID, clients := range h.rooms {
					if _, exists := clients[client]; exists {
						delete(clients, client)
						if len(clients) == 0 {
							delete(h.rooms, roomID)
						}
					}
				}
			}
			h.mutex.Unlock()
			log.Printf("Client unregistered: %s (User ID: %d)", client.Username, client.UserID)

			h.broadcastMessage(&Message{
				Type:      "user_left",
				UserID:    client.UserID,
				Username:  client.Username,
				Avatar:    client.Avatar,
				Content:   client.Username + " left the chat",
				CreatedAt: time.Now(),
			})

		case message := <-h.Broadcast:
			h.broadcastMessage(message)
		}
	}
}

func (h *Hub) broadcastMessage(message *Message) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	if message.RoomID != nil {
		if clients, ok := h.rooms[*message.RoomID]; ok {
			for client := range clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
					delete(clients, client)
				}
			}
		}
	} else {
		for client := range h.clients {
			select {
			case client.send <- message:
			default:
				close(client.send)
				delete(h.clients, client)
			}
		}
	}
}

func (h *Hub) JoinRoom(client *Client, roomID uint) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	if h.rooms[roomID] == nil {
		h.rooms[roomID] = make(map[*Client]bool)
	}
	h.rooms[roomID][client] = true
	log.Printf("Client %s joined room %d", client.Username, roomID)
}

func (h *Hub) LeaveRoom(client *Client, roomID uint) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	if clients, ok := h.rooms[roomID]; ok {
		delete(clients, client)
		if len(clients) == 0 {
			delete(h.rooms, roomID)
		}
		log.Printf("Client %s left room %d", client.Username, roomID)
	}
}

func (h *Hub) GetOnlineUsers() []map[string]interface{} {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	uniqueUsers := make(map[uint]map[string]interface{})
	for client := range h.clients {
		uniqueUsers[client.UserID] = map[string]interface{}{
			"user_id":  client.UserID,
			"username": client.Username,
		}
	}

	users := make([]map[string]interface{}, 0, len(uniqueUsers))
	for _, user := range uniqueUsers {
		users = append(users, user)
	}
	return users
}
