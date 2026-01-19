package db

import (
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var Database *gorm.DB

func GetDBClient(dnsStr string) *gorm.DB {
	if Database != nil {
		return Database
	}

	db, err := gorm.Open(postgres.Open(dnsStr), &gorm.Config{})

	if err != nil {
		panic(fmt.Sprintf("Error connecting to database: %v", err))
	}

	Database = db

	return db
}
