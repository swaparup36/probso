package middleware

import (
	"net/http"
	"strings"

	"github.com/MicahParks/keyfunc"
	"github.com/golang-jwt/jwt/v4"
)

var jwks *keyfunc.JWKS

func InitClerkJWKS() error {
	var err error
	jwks, err = keyfunc.Get("https://united-humpback-28.clerk.accounts.dev/.well-known/jwks.json", keyfunc.Options{})
	return err
}

func ClerkAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Missing Authorization header", http.StatusUnauthorized)
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

		token, err := jwt.Parse(tokenStr, jwks.Keyfunc)
		if err != nil || !token.Valid {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		claims := token.Claims.(jwt.MapClaims)

		// Clerk user ID (IMPORTANT)
		userID := claims["sub"].(string)

		// attach user id to request context
		r.Header.Set("User-ID", userID)

		next.ServeHTTP(w, r)
	})
}
