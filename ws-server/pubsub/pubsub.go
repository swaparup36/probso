package jobqueue

import (
	"log"
	"os"
	"sync"

	"github.com/redis/go-redis/v9"
)

var (
	redisClient *redis.Client
	once        sync.Once
)

func GetRedisClient() *redis.Client {
	once.Do(func() {
		opt, err := redis.ParseURL(os.Getenv("REDIS_URL"))
		if err != nil {
			log.Fatalf("Failed to parse REDIS_URL: %v", err)
		}

		redisClient = redis.NewClient(opt)
	})

	return redisClient
}
