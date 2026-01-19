package db

import (
	"log"

	"gorm.io/gorm"
)

func Migrate(db *gorm.DB) {
	err := db.AutoMigrate(
		&Conversion{},
		&Job{},
		&UserRole{},
		&UserSubscription{},
		&UserTokenBalance{},
	)

	if err != nil {
		log.Fatal("Error migrate schema: ", err)
	}

	log.Printf("Migration successful")
}
