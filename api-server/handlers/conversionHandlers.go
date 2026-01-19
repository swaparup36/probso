package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/swaparup36/pdfvid/api-server/db"
)

func GetConversionHistoryByUserId(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Methods", "GET")

	params := mux.Vars(r)
	userId := params["userId"]

	userIdFromHeader := r.Header.Get("User-ID")

	if userIdFromHeader == "" {
		http.Error(w, "missing User-ID in request header", http.StatusBadRequest)
		return
	}

	if userId != userIdFromHeader {
		http.Error(w, "unauthorized access to conversion history", http.StatusUnauthorized)
		return
	}

	// Get last 10 conversions for the user
	var conversions []db.Conversion
	result := db.Database.Where("user_id = ?", userId).Find(&conversions).Limit(10)

	if result.Error != nil {
		http.Error(w, "Error fetching conversion history", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":     "conversion history fetched successfully",
		"conversions": conversions,
	})
}

func GetConversionById(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Methods", "GET")

	params := mux.Vars(r)
	conversionId := params["conversionId"]

	userId := r.Header.Get("User-ID")

	if userId == "" {
		http.Error(w, "missing User-ID in request header", http.StatusBadRequest)
		return
	}

	var conversion db.Conversion
	result := db.Database.Where("id = ?", conversionId).First(&conversion)

	if result.Error != nil {
		http.Error(w, "invalid conversionId", http.StatusUnauthorized)
		return
	}

	if conversion.UserId != userId {
		http.Error(w, "unauthorized access to conversion details", http.StatusUnauthorized)
		return
	}

	var job db.Job
	jobResult := db.Database.Where("id = ?", conversion.JobId).First(&job)
	println("Conversion details fetched")

	if jobResult.Error != nil {
		http.Error(w, "Unable finding the job for the conversion", http.StatusUnauthorized)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":    "conversion details fetched successfully",
		"conversion": conversion,
		"job":        job,
	})
}

func GetAllConversions(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Methods", "GET")

	var conversions []db.Conversion
	result := db.Database.Find(&conversions)

	if result.Error != nil {
		http.Error(w, result.Error.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":     "all conversions fetched successfully",
		"conversions": conversions,
	})
}
