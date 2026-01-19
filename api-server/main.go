package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/handlers"
	"github.com/swaparup36/pdfvid/api-server/db"
	"github.com/swaparup36/pdfvid/api-server/middleware"
	"github.com/swaparup36/pdfvid/api-server/router"
)

var migrate = flag.Bool("migrate", false, "run migration")

func main() {
	host := os.Getenv("POSTGRES_HOST")
	user := os.Getenv("POSTGRES_USER")
	password := os.Getenv("POSTGRES_PASSWORD")
	dbname := os.Getenv("POSTGRES_DB")
	port := os.Getenv("POSTGRES_PORT")
	sslmode := os.Getenv("POSTGRES_SSLMODE")
	channelBinding := os.Getenv("POSTGRES_CHANNEL_BINDING")
	dnsStr := "host=" + host + " user=" + user + " password=" + password + " dbname=" + dbname + " port=" + port + " sslmode=" + sslmode + " channel_binding=" + channelBinding

	database := db.GetDBClient(dnsStr)
	fmt.Println("Connected to database successfully")

	flag.Parse()

	if *migrate {
		fmt.Println("Running migrations...")
		db.Migrate(database)
		return
	}

	err := middleware.InitClerkJWKS()
	if err != nil {
		panic("Failed to load Clerk JWKS")
	}

	r := router.Router()

	corsHandler := handlers.CORS(
		handlers.AllowedOrigins([]string{
			"http://localhost:3000",
			"http://api.probso.live",
			"https://api.probso.live",
		}),
		handlers.AllowedMethods([]string{
			"GET", "POST", "PUT", "DELETE", "OPTIONS",
		}),
		handlers.AllowedHeaders([]string{
			"Content-Type", "Authorization",
		}),
	)

	log.Fatal(http.ListenAndServe(":8080", corsHandler(r)))
}
