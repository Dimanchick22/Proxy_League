package websocket

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
)

type Client struct {
	hub      *Hub
	conn     *websocket.Conn
	send     chan *Message
	UserID   uint
	Username string
	Avatar   string
}

func NewClient(hub *Hub, conn *websocket.Conn, userID uint, username string, avatar string) *Client {
	return &Client{
		hub:      hub,
		conn:     conn,
		send:     make(chan *Message, 256),
		UserID:   userID,
		Username: username,
		Avatar:   avatar,
	}
}

func (c *Client) ReadPump() {
	defer func() {
		c.hub.Unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, messageData, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		var msg Message
		if err := json.Unmarshal(messageData, &msg); err != nil {
			log.Printf("Error unmarshaling message: %v", err)
			continue
		}

		msg.UserID = c.UserID
		msg.Username = c.Username
		msg.Avatar = c.Avatar
		msg.CreatedAt = time.Now()

		switch msg.Type {
		case "join_room":
			if msg.RoomID != nil {
				c.hub.JoinRoom(c, *msg.RoomID)
				notification := &Message{
					Type:      "user_joined",
					RoomID:    msg.RoomID,
					UserID:    c.UserID,
					Username:  c.Username,
					Avatar:    c.Avatar,
					Content:   c.Username + " joined the room",
					CreatedAt: time.Now(),
				}
				c.hub.Broadcast <- notification
			}
		case "leave_room":
			if msg.RoomID != nil {
				c.hub.LeaveRoom(c, *msg.RoomID)
				notification := &Message{
					Type:      "user_left",
					RoomID:    msg.RoomID,
					UserID:    c.UserID,
					Username:  c.Username,
					Avatar:    c.Avatar,
					Content:   c.Username + " left the room",
					CreatedAt: time.Now(),
				}
				c.hub.Broadcast <- notification
			}
		case "typing":
			notification := &Message{
				Type:      "typing",
				RoomID:    msg.RoomID,
				UserID:    c.UserID,
				Username:  c.Username,
				Avatar:    c.Avatar,
				CreatedAt: time.Now(),
			}
			c.hub.Broadcast <- notification
		case "stop_typing":
			notification := &Message{
				Type:      "stop_typing",
				RoomID:    msg.RoomID,
				UserID:    c.UserID,
				Username:  c.Username,
				Avatar:    c.Avatar,
				CreatedAt: time.Now(),
			}
			c.hub.Broadcast <- notification
		case "message":
			c.hub.Broadcast <- &msg
		default:
			log.Printf("Unknown message type: %s", msg.Type)
		}
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			data, err := json.Marshal(message)
			if err != nil {
				log.Printf("Error marshaling message: %v", err)
				continue
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, data); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
