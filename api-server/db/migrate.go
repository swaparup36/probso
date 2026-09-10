package db

import (
	"log"

	"gorm.io/gorm"
)

func Migrate(db *gorm.DB) {
	if err := db.Exec(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`).Error; err != nil {
		log.Fatal("Error creating uuid-ossp extension: ", err)
	}

	err := db.AutoMigrate(
		&Conversion{},
		&Job{},
		&UserRole{},
		&UserSubscription{},
		&UserTokenBalance{},
		&SupportMessage{},
	)

	if err != nil {
		log.Fatal("Error migrate schema: ", err)
	}

	log.Printf("Migration successful")
}
