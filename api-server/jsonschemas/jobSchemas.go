package jsonschemas

import "time"

type CreateJobReq struct {
	Title  string `json:"title"`
	PdfUrl string `json:"pdf_url"`
}

type UpdateJobStatus struct {
	JobId  string `json:"jobId"`
	Status string `json:"status"`
}

type UpdateJobOutput struct {
	JobId           string `json:"jobId"`
	OutputUrl       string `json:"output_url"`
	ConversionTitle string `json:"conversion_title"`
}

type TaskToEnqueue struct {
	JobId  string `json:"jobId"`
	UserId string `json:"userId"`
	Title  string `json:"title"`
}

type CreateUserRoleReq struct {
	UserId string `json:"userId"`
}

type CreateSubscriptionReq struct {
	SubscriptionId string `json:"subscription_id"`
	UserId         string `json:"userId"`
}

type CancelSubscriptionReq struct {
	SubscriptionId string `json:"subscriptionId"`
}

type UpdateSubscriptionStatusReq struct {
	SubscriptionId string `json:"subscription_id"`
	Status         string `json:"status"`
}

type DodoSubscription struct {
	ID               string    `json:"id"`
	Status           string    `json:"status"`
	ProductID        string    `json:"product_id"`
	CurrentPeriodEnd int64     `json:"current_period_end"`
	CancelledAt      time.Time `json:"cancelled_at"`
	Customer         struct {
		ID string `json:"id"`
	} `json:"customer"`
}
