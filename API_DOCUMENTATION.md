# 📚 Roomie API Documentation

## Base URL
```
Production: https://api.roomie.com/api/v1
Development: http://localhost:5000/api/v1
```

## Authentication
All protected endpoints require JWT Bearer token in Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1995-05-15",
  "gender": "male"
}

Response: 201
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response: 200
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Refresh Token
```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response: 200
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

---

## 👤 User Management Endpoints

### Get User Profile
```http
GET /users/:userId
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "profilePhoto": "/uploads/profiles/...",
      "bio": "...",
      "location": { ... },
      "preferences": { ... },
      "lifestyle": { ... }
    }
  }
}
```

### Update Profile
```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "bio": "Looking for a quiet roommate",
  "occupation": "Software Engineer"
}

Response: 200
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { "user": { ... } }
}
```

### Upload Profile Photo
```http
POST /users/profile-photo
Authorization: Bearer <token>
Content-Type: multipart/form-data

photo: <file>

Response: 200
{
  "success": true,
  "message": "Profile photo uploaded successfully",
  "data": {
    "profilePhoto": "/uploads/profiles/abc123.jpg"
  }
}

Error (Duplicate): 409
{
  "success": false,
  "message": "Duplicate media detected",
  "similarity": 95.5,
  "existingFile": { ... }
}
```

### Update Location
```http
PUT /users/location
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "country": "USA"
}

Response: 200
{
  "success": true,
  "message": "Location updated successfully"
}
```

---

## 🤝 Matching Endpoints

### Get Potential Matches
```http
GET /matches/discover?limit=20&minCompatibility=50
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "matches": [
      {
        "user": { ... },
        "compatibilityScore": 85
      }
    ],
    "total": 15
  }
}
```

### Like User (Swipe Right)
```http
POST /matches/like/:targetUserId
Authorization: Bearer <token>

Response: 200 (No Match)
{
  "success": true,
  "message": "User liked",
  "data": {
    "isMatch": false
  }
}

Response: 200 (Match!)
{
  "success": true,
  "message": "It's a match!",
  "data": {
    "isMatch": true,
    "match": {
      "id": "...",
      "user": { ... },
      "compatibilityScore": 87
    }
  }
}
```

### Pass User (Swipe Left)
```http
POST /matches/pass/:targetUserId
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "message": "User passed"
}
```

### Get My Matches
```http
GET /matches?page=1&limit=20
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "matches": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

---

## 💬 Messaging Endpoints

### Send Message
```http
POST /messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "matchId": "...",
  "receiverId": "...",
  "type": "text",
  "content": "Hey, how are you?"
}

// For media messages
Content-Type: multipart/form-data
matchId: ...
receiverId: ...
type: image
media: <file>

Response: 201
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": { ... }
  }
}
```

### Get Messages
```http
GET /messages/:matchId?page=1&limit=50
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "messages": [ ... ],
    "pagination": { ... }
  }
}
```

### Mark Messages as Read
```http
PUT /messages/:matchId/read
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "message": "Messages marked as read"
}
```

### Add Reaction
```http
POST /messages/:messageId/reaction
Authorization: Bearer <token>
Content-Type: application/json

{
  "emoji": "❤️"
}

Response: 200
{
  "success": true,
  "message": "Reaction added"
}
```

### Get Unread Count
```http
GET /messages/unread/count
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

---

## 🏘️ Property Endpoints

### Create Property Listing
```http
POST /properties
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Spacious 2BR Apartment",
  "description": "Beautiful apartment in downtown",
  "type": "apartment",
  "price": 2000,
  "currency": "USD",
  "address": "123 Main St",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "bedrooms": 2,
  "bathrooms": 2,
  "availableFrom": "2024-01-01",
  "leaseDuration": 12,
  "petFriendly": true,
  "furnished": true,
  "amenities": ["wifi", "parking", "gym"]
}

Response: 201
{
  "success": true,
  "message": "Property created successfully",
  "data": {
    "property": { ... }
  }
}
```

### Search Properties
```http
GET /properties/search?minPrice=1000&maxPrice=3000&type=apartment&bedrooms=2&latitude=40.7128&longitude=-74.0060&radius=10
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "properties": [ ... ],
    "pagination": { ... }
  }
}
```

### Like Property
```http
POST /properties/:propertyId/like
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "message": "Property liked"
}
```

---

## 🎮 Game Endpoints

### Get All Games
```http
GET /games
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "games": [
      {
        "_id": "...",
        "name": "Trivia Master",
        "description": "Test your knowledge",
        "category": "Quiz",
        "difficulty": "medium",
        "pointsReward": 50
      }
    ]
  }
}
```

### Create Game Session
```http
POST /games/session
Authorization: Bearer <token>
Content-Type: application/json

{
  "gameId": "..."
}

Response: 201
{
  "success": true,
  "message": "Game session created",
  "data": {
    "session": { ... }
  }
}
```

### Submit Score
```http
POST /games/session/:sessionId/score
Authorization: Bearer <token>
Content-Type: application/json

{
  "score": 850
}

Response: 200
{
  "success": true,
  "message": "Score submitted",
  "data": {
    "session": { ... }
  }
}
```

### Get Game Leaderboard
```http
GET /games/:gameId/leaderboard?limit=10
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "user": { ... },
        "totalScore": 5000,
        "gamesPlayed": 15,
        "wins": 8,
        "winRate": "53.3"
      }
    ]
  }
}
```

---

## 🏆 Challenge Endpoints

### Get Active Challenges
```http
GET /challenges?type=daily
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "challenges": [
      {
        "_id": "...",
        "title": "Match Master",
        "description": "Get 5 matches today",
        "type": "daily",
        "pointsReward": 100,
        "requirements": [
          {
            "action": "match",
            "target": 5
          }
        ],
        "startDate": "2024-01-01T00:00:00Z",
        "endDate": "2024-01-02T00:00:00Z"
      }
    ]
  }
}
```

### Join Challenge
```http
POST /challenges/:challengeId/join
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "message": "Joined challenge successfully",
  "data": {
    "challenge": { ... }
  }
}
```

### Update Progress
```http
PUT /challenges/:challengeId/progress
Authorization: Bearer <token>
Content-Type: application/json

{
  "progress": 3
}

Response: 200
{
  "success": true,
  "message": "Progress updated",
  "data": {
    "challenge": { ... }
  }
}
```

### Get My Challenges
```http
GET /challenges/my-challenges
Authorization: Bearer <token>

Response: 200
{
  "success": true,
  "data": {
    "challenges": [ ... ]
  }
}
```

---

## 📊 Response Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request (validation error)
- **401** - Unauthorized (invalid/expired token)
- **403** - Forbidden (blocked/banned)
- **404** - Not Found
- **409** - Conflict (duplicate)
- **429** - Too Many Requests (rate limit)
- **500** - Internal Server Error

## Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

---

## 🔒 Rate Limits

- **General:** 100 requests per 15 minutes per IP
- **Auth endpoints:** Lower limits for security
- **File uploads:** Max 50MB per file

## 📝 Notes

1. All dates are in ISO 8601 format
2. All coordinates use [longitude, latitude] format
3. Pagination defaults: page=1, limit=20
4. Files are checked for duplicates before upload
5. Media files support: JPG, PNG, WEBP, MP4

---

**Last Updated:** December 2024  
**API Version:** 1.0.0
