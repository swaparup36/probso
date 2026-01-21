package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	svix "github.com/svix/svix-webhooks/go"
	"github.com/swaparup36/pdfvid/api-server/db"
)

func GetUserTokenBalance(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Methods", "GET")

	params := mux.Vars(r)
	userId := params["userId"]

	var userRole db.UserTokenBalance
	result := db.Database.Where("user_id = ?", userId).Find(&userRole)

	if result.Error != nil {
		http.Error(w, "Error fetching user token balance", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":          "user token balance fetched successfully",
		"userTokenBalance": userRole,
	})
}

func CreateUserTokenBalance(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	fmt.Println("Request recieved at create-user-token-balance handler")

	if r.Method != http.MethodPost {
		fmt.Println("Method not allowed")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	payload, err := io.ReadAll(r.Body)
	if err != nil {
		fmt.Println("Invalid body")
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	secret := os.Getenv("CLERK_WEBHOOK_SECRET_CREATE_USER_BALANCE")
	wh, err := svix.NewWebhook(secret)
	if err != nil {
		fmt.Println("Webhook init failed")
		http.Error(w, "Webhook init failed", http.StatusInternalServerError)
		return
	}

	if err := wh.Verify(payload, r.Header); err != nil {
		fmt.Println("Unauthorized webhook")
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
		fmt.Println("Invalid JSON payload")
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	if event.Type != "user.created" {
		fmt.Println("Invalid event type")
		w.WriteHeader(http.StatusOK)
		return
	}

	userId := event.Data.ID

	userTokenBalance := db.UserTokenBalance{
		UserId:  userId,
		Balance: 1,
	}

	if err := db.Database.Create(&userTokenBalance).Error; err != nil {
		fmt.Println("Internal server error:", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Println("User token balance created successfully for user ID:", userId)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"userTokenBalance": userTokenBalance,
		"message":          "Token balance initialized",
	})
}

func UpdateUserTokenBalanceOnSubscriptionRenew(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Methods", "PUT")

	rawBody, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Unable to read request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	secret := os.Getenv("DODO_WEBHOOK_SECRET")
	signature := r.Header.Get("X-Dodo-Signature")

	if signature == "" {
		http.Error(w, "Missing webhook signature", http.StatusUnauthorized)
		return
	}

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(rawBody)
	expectedSignature := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(signature), []byte(expectedSignature)) {
		http.Error(w, "Invalid webhook signature", http.StatusUnauthorized)
		return
	}

	var body struct {
		Type string `json:"type"`
		Data struct {
			SubscriptionID string `json:"subscription_id"`
			PlanID         string `json:"plan_id"`
		} `json:"data"`
	}

	if err := json.Unmarshal(rawBody, &body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	if body.Data.SubscriptionID == "" || body.Data.PlanID == "" {
		http.Error(w, "Missing subscription ID or plan ID", http.StatusBadRequest)
		return
	}

	var subscription db.UserSubscription
	subscriptionFetchResult := db.Database.Where("subscription_id = ?", body.Data.SubscriptionID).First(&subscription)

	if subscriptionFetchResult.Error != nil {
		http.Error(w, "Subscription not found", http.StatusNotFound)
		return
	}

	userId := subscription.UserId

	var userTokenBalance db.UserTokenBalance
	userBalance := db.Database.Where("user_id = ?", userId).First(&userTokenBalance)
	if userBalance.Error != nil {
		http.Error(w, "User token balance not found", http.StatusNotFound)
		return
	}

	tokenAmount := 0
	if subscription.PlanId == os.Getenv("NEXT_PUBLIC_DODO_STARTER_PLAN_ID") {
		tokenAmount = 150
	} else if subscription.PlanId == os.Getenv("NEXT_PUBLIC_DODO_CREATOR_PLAN_ID") {
		tokenAmount = 500 + userTokenBalance.Balance
	} else {
		http.Error(w, "Unknown plan ID", http.StatusBadRequest)
		return
	}

	result := db.Database.
		Model(&userTokenBalance).
		Where("user_id = ?", userId).
		Update("balance", tokenAmount)

	if result.Error != nil {
		http.Error(w, "Error updating user token balance", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "user token balance updated successfully",
	})
}
