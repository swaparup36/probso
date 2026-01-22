package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/swaparup36/pdfvid/api-server/db"
	"github.com/swaparup36/pdfvid/api-server/jobqueue"
	"github.com/swaparup36/pdfvid/api-server/jsonschemas"
)

var ctx = context.Background()

func CreateJob(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Methods", "POST")
	fmt.Println("request recieved at /create-job")

	userId := r.Header.Get("User-ID")

	if userId == "" {
		fmt.Println("User-ID header is missing")
		http.Error(w, "User-ID header is missing", http.StatusUnauthorized)
		return
	}

	var body jsonschemas.CreateJobReq
	err := json.NewDecoder(r.Body).Decode(&body)

	if err != nil {
		fmt.Println("Invalid JSON body")
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	defer r.Body.Close()

	// Check if user has enough tokens
	var userTokenBalance db.UserTokenBalance
	userTokenResult := db.Database.Where("user_id = ?", userId).First(&userTokenBalance)
	if userTokenResult.Error != nil {
		fmt.Println("Error fetching user token balance")
		http.Error(w, "Error fetching user token balance", http.StatusInternalServerError)
		return
	}

	if userTokenBalance.Balance <= 0 {
		fmt.Println("Insufficient token balance")
		http.Error(w, "Insufficient token balance", http.StatusPaymentRequired)
		return
	}

	job := db.Job{
		Status:  "pending",
		Pdf_url: body.PdfUrl,
		UserId:  userId,
	}

	jobCreationResult := db.Database.Create(&job)

	if jobCreationResult.Error != nil {
		fmt.Println("Error creating job:", jobCreationResult.Error)
		http.Error(w, jobCreationResult.Error.Error(), http.StatusInternalServerError)
		return
	}

	// Enqueue the job in Redis
	redisClient := jobqueue.GetRedisClient()
	taskData := jsonschemas.TaskToEnqueue{
		JobId:  job.Id.String(),
		UserId: job.UserId,
		Title:  body.Title,
	}

	// convert taskData to JSON
	taskDataJson, taskDataJsonErr := json.Marshal(taskData)
	if taskDataJsonErr != nil {
		fmt.Println("Error marshalling task data:", taskDataJsonErr)
		http.Error(w, "Error processing job json", http.StatusInternalServerError)
		return
	}

	enqueueErr := redisClient.LPush(ctx, "task_queue", taskDataJson).Err()
	if enqueueErr != nil {
		fmt.Println("Failed to enqueue job:", enqueueErr)
		db.Database.Model(&job).Update("status", "failed")
		db.Database.Model(&job).Update("error_message", "enqueue failed")
		http.Error(w, "Failed to enqueue job", http.StatusInternalServerError)
		return
	}

	// Deduct one token from user balance and add one to onhold
	newBalance := userTokenBalance.Balance - 1
	newOnhold := userTokenBalance.Onhold + 1

	balanceUpdateResult := db.Database.Model(&userTokenBalance).Updates(map[string]interface{}{
		"balance": newBalance,
		"onhold":  newOnhold,
	})

	if balanceUpdateResult.Error != nil {
		fmt.Println("Error updating user token balance:", balanceUpdateResult.Error)
		http.Error(w, "Error updating user token balance", http.StatusInternalServerError)
		return
	}

	fmt.Println("Job created successfully with ID:", job.Id)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"jobId":   job.Id,
		"message": "job created successfully",
		"status":  job.Status,
	})
}

func UpdateJobStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Methods", "POST")

	var body jsonschemas.UpdateJobStatus
	err := json.NewDecoder(r.Body).Decode(&body)

	if err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	var job db.Job
	result := db.Database.Where("id = ?", body.JobId).First(&job)

	if result.Error != nil {
		http.Error(w, "invalid jobId", http.StatusUnauthorized)
		return
	}

	jobStatusUpdateResult := db.Database.Model(&job).Update("status", body.Status)

	if jobStatusUpdateResult.Error != nil {
		http.Error(w, jobStatusUpdateResult.Error.Error(), http.StatusInternalServerError)
		return
	}

	redisClient := jobqueue.GetRedisClient()

	jobStatusData := map[string]interface{}{
		"jobId":  job.Id,
		"status": job.Status,
	}

	jobStatusDataJson, jobStatusDataJsonErr := json.Marshal(jobStatusData)
	if jobStatusDataJsonErr != nil {
		log.Fatalf("could not marshal job: %v", jobStatusDataJsonErr)
	}

	publishErr := redisClient.Publish(ctx, "job_status_channel", jobStatusDataJson).Err()
	if publishErr != nil {
		log.Printf("Failed to publish jobstatus: %v", publishErr)
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"jobId":   job.Id,
		"message": "job status updated successfully",
		"status":  job.Status,
	})
}

func UpdateJobOutput(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Methods", "POST")

	var body jsonschemas.UpdateJobOutput
	err := json.NewDecoder(r.Body).Decode(&body)

	if err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	var job db.Job
	result := db.Database.Where("id = ?", body.JobId).First(&job)

	if result.Error != nil {
		http.Error(w, "invalid jobId", http.StatusUnauthorized)
		return
	}

	jobOutputUpdateResult := db.Database.Model(&job).Updates(map[string]interface{}{
		"output_url": body.OutputUrl,
		"status":     "completed",
	})

	if jobOutputUpdateResult.Error != nil {
		http.Error(w, jobOutputUpdateResult.Error.Error(), http.StatusInternalServerError)
		return
	}

	conversion := db.Conversion{
		Title:  body.ConversionTitle,
		UserId: job.UserId,
		JobId:  job.Id.String(),
	}

	conversionCreationResult := db.Database.Create(&conversion)

	if conversionCreationResult.Error != nil {
		http.Error(w, conversionCreationResult.Error.Error(), http.StatusInternalServerError)
		return
	}

	redisClient := jobqueue.GetRedisClient()
	conversionData := map[string]interface{}{
		"id":     conversion.Id,
		"title":  conversion.Title,
		"userId": conversion.UserId,
		"jobId":  conversion.JobId,
	}
	conversionDataJson, conversionDataJsonErr := json.Marshal(conversionData)
	if conversionDataJsonErr != nil {
		log.Fatalf("could not marshal conversion: %v", conversionDataJsonErr)
	}

	publishErr := redisClient.Publish(ctx, "job_output_channel", conversionDataJson).Err()
	if publishErr != nil {
		log.Printf("Failed to publish conversion: %v", publishErr)
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"jobId":        job.Id,
		"message":      "job output updated successfully",
		"status":       job.Status,
		"output":       job.Output_url,
		"conversionId": conversion.Id,
	})
}

func GetJobDetailsById(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Methods", "GET")

	params := mux.Vars(r)
	jobId := params["jobId"]

	userId := r.Header.Get("User-ID")

	if userId == "" {
		http.Error(w, "User-ID header is missing", http.StatusUnauthorized)
		return
	}

	var job db.Job
	result := db.Database.Where("id = ?", jobId).First(&job)

	if result.Error != nil {
		http.Error(w, "invalid jobId", http.StatusUnauthorized)
		return
	}

	if job.UserId != userId {
		http.Error(w, "unauthorized access to job details", http.StatusForbidden)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":    "job details fetched successfully",
		"jobDetails": job,
	})
}

func GetJobHistoryByUserId(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Methods", "GET")

	params := mux.Vars(r)
	userId := params["userId"]

	userIdFromHeader := r.Header.Get("User-ID")

	if userIdFromHeader == "" {
		http.Error(w, "User-ID header is missing", http.StatusUnauthorized)
		return
	}

	if userIdFromHeader != userId {
		http.Error(w, "unauthorized access to job history", http.StatusForbidden)
		return
	}

	var jobs []db.Job
	result := db.Database.Where("user_id = ?", userId).Find(&jobs)

	if result.Error != nil {
		http.Error(w, "Error fetching job history", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "job history fetched successfully",
		"jobs":    jobs,
	})
}

func GetAllJobs(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Methods", "GET")

	var jobs []db.Job
	result := db.Database.Find(&jobs)

	if result.Error != nil {
		http.Error(w, result.Error.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "all jobs fetched successfully",
		"jobs":    jobs,
	})
}
