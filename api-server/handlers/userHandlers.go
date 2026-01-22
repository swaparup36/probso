package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	svix "github.com/svix/svix-webhooks/go"
	"github.com/swaparup36/pdfvid/api-server/db"
)

func GetUserRole(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Methods", "GET")

	params := mux.Vars(r)
	userId := params["userId"]

	var userRole db.UserRole
	result := db.Database.Where("user_id = ?", userId).Find(&userRole)

	if result.Error != nil {
		http.Error(w, "Error fetching user role", http.StatusInternalServerError)
		return
	}

	if result.RowsAffected == 0 {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message":  "No user role found with the given ID",
			"userRole": nil,
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":  "user role fetched successfully",
		"userRole": userRole,
	})
}

func CreateUserRole(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	payload, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	secret := os.Getenv("CLERK_WEBHOOK_SECRET_CREATE_USER_ROLE")
	wh, err := svix.NewWebhook(secret)
	if err != nil {
		http.Error(w, "Webhook init failed", http.StatusInternalServerError)
		return
	}

	if err := wh.Verify(payload, r.Header); err != nil {
		http.Error(w, "Unauthorized webhook", http.StatusUnauthorized)
		return
	}

	var event struct {
		Object string `json:"object"`
		Type   string `json:"type"`
		Data   struct {
			ID string `json:"id"`
		} `json:"data"`
	}

	if err := json.Unmarshal(payload, &event); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	if event.Type != "user.created" {
		w.WriteHeader(http.StatusOK)
		return
	}

	userRole := db.UserRole{
		UserId: event.Data.ID,
		Role:   "user",
	}

	if err := db.Database.Create(&userRole).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"userRole": userRole,
		"message":  "user role created successfully",
	})
}
