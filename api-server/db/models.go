package db

import (
	"time"

	"github.com/google/uuid"
)

type Conversion struct {
	Id        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	Title     string    `gorm:"type:varchar(255);not null"`
	UserId    string    `gorm:"type:varchar(255);not null"`
	JobId     string    `gorm:"type:varchar(255);not null"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`
}

type Job struct {
	Id           uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	UserId       string    `gorm:"type:varchar(255);not null"`
	Status       string    `gorm:"type:varchar(255);check:status IN ('pending','in_progress','completed','failed');not null"`
	Pdf_url      string    `gorm:"type:varchar(255);not null"`
	Output_url   string    `gorm:"type:varchar(255)"`
	ErrorMessage string    `gorm:"type:varchar(255)"`
	CreatedAt    time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime"`
}

type UserRole struct {
	Id     uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	UserId string    `gorm:"type:varchar(255);not null;unique"`
	Role   string    `gorm:"type:varchar(50);check:role IN ('admin','user');not null"`
}

type UserSubscription struct {
	Id             uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	UserId         string    `gorm:"type:varchar(255);not null;unique"`
	CustomerId     string    `gorm:"type:varchar(255);not null"`
	PlanId         string    `gorm:"type:varchar(255);not null"`
	Status         string    `gorm:"type:varchar(50);not null"`
	SubscriptionId string    `gorm:"type:varchar(255);not null"`
}

type UserTokenBalance struct {
	Id        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	UserId    string    `gorm:"type:varchar(255);not null;unique"`
	Balance   int       `gorm:"not null"`
	Onhold    int       `gorm:"not null;default:0"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

type SupportMessage struct {
	Id        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	Name      string    `gorm:"type:varchar(255);not null"`
	Email     string    `gorm:"type:varchar(255);not null"`
	Subject   string    `gorm:"type:varchar(255);not null"`
	Message   string    `gorm:"type:text;not null"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`
}
