package router

import (
	"net/http"

	"github.com/gorilla/mux"
	customHandlers "github.com/swaparup36/pdfvid/api-server/handlers"
	"github.com/swaparup36/pdfvid/api-server/middleware"
)

func Router() *mux.Router {
	router := mux.NewRouter()

	router.HandleFunc("/health", customHandlers.HealthCheck).Methods("GET")

	// Job routes
	router.Handle("/create-job", middleware.ClerkAuthMiddleware(http.HandlerFunc(customHandlers.CreateJob))).Methods("POST")
	// router.HandleFunc("/update-job-status", customHandlers.UpdateJobStatus).Methods("POST")
	// router.HandleFunc("/update-job-output", customHandlers.UpdateJobOutput).Methods("POST")
	router.Handle("/job/{jobId}", middleware.ClerkAuthMiddleware(http.HandlerFunc(customHandlers.GetJobDetailsById))).Methods("GET")
	router.Handle("/jobs/{userId}", middleware.ClerkAuthMiddleware(http.HandlerFunc(customHandlers.GetJobHistoryByUserId))).Methods("GET")
	// router.HandleFunc("/jobs", customHandlers.GetAllJobs).Methods("GET")

	// Conversion routes
	router.Handle("/conversions/{userId}", middleware.ClerkAuthMiddleware(http.HandlerFunc(customHandlers.GetConversionHistoryByUserId))).Methods("GET")
	router.Handle("/conversion/{conversionId}", middleware.ClerkAuthMiddleware(http.HandlerFunc(customHandlers.GetConversionById))).Methods("GET")
	// router.HandleFunc("/conversions", customHandlers.GetAllConversions).Methods("GET")

	// Subscription routes
	router.HandleFunc("/create-subscription", customHandlers.CreateSubscription).Methods("POST")
	router.HandleFunc("/subscription/{userId}", customHandlers.GetSubscriptionByUserId).Methods("GET")
	router.Handle("/update-subscription-status", middleware.ClerkAuthMiddleware(http.HandlerFunc(customHandlers.UpdateSubscriptionStatus))).Methods("POST")
	router.Handle("/cancel-subscription", middleware.ClerkAuthMiddleware(http.HandlerFunc(customHandlers.CancelSubscriptionByUserId))).Methods("PATCH")

	// User Role routes
	router.HandleFunc("/create-user-role", customHandlers.CreateUserRole).Methods("POST")
	router.HandleFunc("/user-role/{userId}", customHandlers.GetUserRole).Methods("GET")

	// User Token Balance routes
	router.HandleFunc("/create-user-token-balance", customHandlers.CreateUserTokenBalance).Methods("POST")
	router.HandleFunc("/user-token-balance/{userId}", customHandlers.GetUserTokenBalance).Methods("GET")
	router.HandleFunc("/update-user-token-balance-on-subscription-renew", customHandlers.UpdateUserTokenBalanceOnSubscriptionRenew).Methods("POST")

	// Support Message routes
	router.HandleFunc("/create-support-message", customHandlers.CreateSupportMessage).Methods("POST")
	router.Handle("/support-messages", middleware.ClerkAuthMiddleware(http.HandlerFunc(customHandlers.GetAllSupportMessages))).Methods("GET")

	return router
}
