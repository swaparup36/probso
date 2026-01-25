package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/swaparup36/pdfvid/api-server/db"
	"github.com/swaparup36/pdfvid/api-server/jsonschemas"
)

func CreateSupportMessage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Methods", "POST")

	var body jsonschemas.CreateSupportMessageReq
	err := json.NewDecoder(r.Body).Decode(&body)

	if err != nil {
		fmt.Println("Invalid JSON body")
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	defer r.Body.Close()

	supportMessage := db.SupportMessage{
		Name:    body.Name,
		Email:   body.Email,
		Subject: body.Subject,
		Message: body.Message,
	}
	supportMessageCreationResult := db.Database.Create(&supportMessage)

	if supportMessageCreationResult.Error != nil {
		fmt.Println("Error creating support message:", supportMessageCreationResult.Error)
		http.Error(w, supportMessageCreationResult.Error.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":         "support message created successfully",
		"supportMessages": supportMessage,
	})
}

func GetAllSupportMessages(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Methods", "GET")

	userIdFromHeader := r.Header.Get("User-ID")

	if userIdFromHeader == "" {
		http.Error(w, "missing User-ID in request header", http.StatusBadRequest)
		return
	}

	// Get the user role from the database
	var userRole db.UserRole
	userRoleFetchResult := db.Database.Where("user_id = ?", userIdFromHeader).First(&userRole)

	if userRoleFetchResult.Error != nil {
		http.Error(w, "Error fetching user role", http.StatusInternalServerError)
		return
	}

	if userRole.Role != "admin" {
		http.Error(w, "unauthorized access to support messages", http.StatusUnauthorized)
		return
	}

	// Fetch all support messages
	var supportMessages []db.SupportMessage
	supportMessagesFetchResult := db.Database.Find(&supportMessages)

	if supportMessagesFetchResult.Error != nil {
		fmt.Println("Error fetching support messages:", supportMessagesFetchResult.Error)
		http.Error(w, supportMessagesFetchResult.Error.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":         "support messages fetched successfully",
		"supportMessages": supportMessages,
	})
}
