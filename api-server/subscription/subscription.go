package subscription

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/swaparup36/pdfvid/api-server/jsonschemas"
)

func VerifyDodoSubscription(subscriptionID string) (*jsonschemas.DodoSubscription, error) {
	url := fmt.Sprintf(
		"https://api.dodopayments.com/v1/subscriptions/%s",
		subscriptionID,
	)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+os.Getenv("DODO_PAYMENTS_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("invalid subscription (status %d)", resp.StatusCode)
	}

	var sub jsonschemas.DodoSubscription
	if err := json.NewDecoder(resp.Body).Decode(&sub); err != nil {
		return nil, err
	}

	return &sub, nil
}

func IsSubscriptionValid(sub *jsonschemas.DodoSubscription, expectedProductID string) bool {
	if sub.Status != "active" && sub.Status != "trialing" {
		return false
	}

	if sub.ProductID != expectedProductID {
		return false
	}

	if sub.CancelledAt != nil {
		return false
	}

	if time.Now().Unix() > sub.CurrentPeriodEnd {
		return false
	}

	return true
}

func DetermineTokensForPlan(productID string) int {
	switch productID {
	case os.Getenv("NEXT_PUBLIC_DODO_STARTER_PLAN_ID"):
		return 150
	case os.Getenv("NEXT_PUBLIC_DODO_CREATOR_PLAN_ID"):
		return 500
	default:
		return 0
	}
}

func CancelDodoSubscription(subscriptionID string) bool {
	url := fmt.Sprintf("https://api.dodopayments.com/v1/subscriptions/%s", subscriptionID)

	// Set body to cancel at next billing
	body := map[string]interface{}{
		"cancel_at_next_billing_date": true,
	}

	jsonBody, _ := json.Marshal(body)

	req, err := http.NewRequest(http.MethodPatch, url, bytes.NewBuffer(jsonBody))
	if err != nil {
		panic(err)
	}

	req.Header.Set("Authorization", "Bearer "+os.Getenv("DODO_PAYMENTS_API_KEY"))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error: ", err)
		return false
	}
	defer resp.Body.Close()

	return resp.StatusCode == http.StatusOK
}
