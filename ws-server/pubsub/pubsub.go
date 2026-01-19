package pubsub

import (
	"os"

	"github.com/redis/go-redis/v9"
)

var redisClient *redis.Client
var connectionStr = os.Getenv("REDIS_URL")

func GetRedisClient() *redis.Client {
	if redisClient != nil {
		return redisClient
	}

	rdb := redis.NewClient(&redis.Options{
		Addr: connectionStr,
	})

	redisClient = rdb
	return redisClient
}
