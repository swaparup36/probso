package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/swaparup36/pdfvid/api-server/db"
	"github.com/swaparup36/pdfvid/api-server/jsonschemas"
	"github.com/swaparup36/pdfvid/api-server/subscription"
)

func CreateSubscription(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Methods", "GET")

	var body jsonschemas.CreateSubscriptionReq
	err := json.NewDecoder(r.Body).Decode(&body)

	if err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	defer r.Body.Close()

	sub, err := subscription.VerifyDodoSubscription(body.SubscriptionId)
	if err != nil {
		http.Error(w, "Invalid subscription", http.StatusBadRequest)
		return
	}

	if !subscription.IsSubscriptionValid(sub, "prod_basic_123") {
		http.Error(w, "Subscription not valid", http.StatusForbidden)
		return
	}

	userSubscription := db.UserSubscription{
		UserId:         body.UserId,
		CustomerId:     sub.Customer.ID,
		PlanId:         sub.ProductID,
		Status:         sub.Status,
		SubscriptionId: body.SubscriptionId,
	}

	userSubscriptionResult := db.Database.Create(&userSubscription)

	if userSubscriptionResult.Error != nil {
		http.Error(w, userSubscriptionResult.Error.Error(), http.StatusInternalServerError)
		return
	}

	// Update user token balance based on plan
	var userTokenBalance db.UserTokenBalance
	tokensToAdd := subscription.DetermineTokensForPlan(sub.ProductID)

	TokensToCarryForward := false

	if TokensToCarryForward {
		// Fetch existing token balance
		result := db.Database.Where("user_id = ?", body.UserId).First(&userTokenBalance)
		if result.Error != nil {
			http.Error(w, "Error fetching user token balance", http.StatusInternalServerError)
			return
		}
		tokensToAdd += userTokenBalance.Balance
	}

	userTokenUpdateResult := db.Database.Model(&userTokenBalance).Where("user_id = ?", body.UserId).Update("token_balance", tokensToAdd)
	if userTokenUpdateResult.Error != nil {
		http.Error(w, "Error updating user token balance", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"userSubscription": userSubscriptionResult,
		"message":          "user role created successfully",
	})
}

func GetSubscriptionByUserId(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Methods", "GET")

	params := mux.Vars(r)
	userId := params["userId"]

	var userSubscription db.UserSubscription
	result := db.Database.Where("user_id = ?", userId).Find(&userSubscription)

	if result.Error != nil {
		http.Error(w, "Error fetching user subscription", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":          "user subscription fetched successfully",
		"userSubscription": userSubscription,
	})
}

func UpdateSubscriptionStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Methods", "PUT")

	var body jsonschemas.UpdateSubscriptionStatusReq
	err := json.NewDecoder(r.Body).Decode(&body)

	if err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	userId := r.Header.Get("User-ID")

	// Verify that the subscription belongs to the user
	var userSubscriptionCheck db.UserSubscription
	checkResult := db.Database.Where("subscription_id = ?", body.SubscriptionId).First(&userSubscriptionCheck)

	if checkResult.Error != nil {
		http.Error(w, "Error: Unable to find subscription with subscription_id", http.StatusUnauthorized)
		return
	}

	if userSubscriptionCheck.UserId != userId {
		http.Error(w, "Unauthorized: Subscription does not belong to the user", http.StatusUnauthorized)
		return
	}

	defer r.Body.Close()

	var userSubscription db.UserSubscription
	result := db.Database.Model(&userSubscription).Where("subscription_id = ?", body.SubscriptionId).Update("status", body.Status)

	if result.Error != nil {
		http.Error(w, "Error updating subscription status", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "subscription status updated successfully",
		"status":  body.Status,
	})
}

func CancelSubscriptionByUserId(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Methods", "PATCH")

	userId := r.Header.Get("User-ID")

	var body jsonschemas.CancelSubscriptionReq
	err := json.NewDecoder(r.Body).Decode(&body)

	if err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	defer r.Body.Close()

	// Cancel the subscription from dodo payments
	var userSubscription db.UserSubscription
	result := db.Database.Where("subscription_id = ?", body.SubscriptionId).First(&userSubscription)

	if result.Error != nil {
		http.Error(w, "Error fetching user subscription", http.StatusInternalServerError)
		return
	}

	if userSubscription.UserId != userId {
		http.Error(w, "Unauthorized: Subscription does not belong to the user", http.StatusUnauthorized)
		return
	}

	cancelSuccess := subscription.CancelDodoSubscription(userSubscription.SubscriptionId)

	if !cancelSuccess {
		http.Error(w, "Error cancelling subscription with Dodo Payments", http.StatusInternalServerError)
		return
	}

	// Update subscription status in database
	statusUpdateResult := db.Database.Where("id = ?", userSubscription.Id).Update("status", "canceled")

	if statusUpdateResult.Error != nil {
		http.Error(w, "Error deleting user subscription", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "user subscription deleted successfully",
	})
}
