# 📮 Postman Collection - Usage Guide

## 🚀 Quick Setup

### Step 1: Import Collection
1. Open Postman
2. Click **Import** button
3. Select `postman_collection.json`
4. Collection will be imported with all 70+ endpoints

### Step 2: Configure Variables
The collection uses variables that auto-populate:
- `base_url` - API base URL (default: http://localhost:5000/api/v1)
- `access_token` - Auto-set after login
- `refresh_token` - Auto-set after login
- `user_id` - Auto-set after registration/login
- `match_id` - Auto-set when match occurs
- `property_id` - Auto-set after creating property
- `game_id` - Manual or from game list
- `challenge_id` - Manual or from challenge list

### Step 3: Update Base URL (if needed)
1. Click on the collection name
2. Go to **Variables** tab
3. Update `base_url` to your server URL
   - Local: `http://localhost:5000/api/v1`
   - Production: `https://your-domain.com/api/v1`

---

## 🔄 Testing Workflow

### Complete User Flow Example

#### 1️⃣ **Register & Login**
```
1. Auth → Register User
   - Automatically sets access_token, refresh_token, user_id
   
2. Auth → Login (optional - if already registered)
   - Same auto-population
```

#### 2️⃣ **Setup Profile**
```
3. User Management → Update Profile
4. User Management → Update Preferences
5. User Management → Update Lifestyle
6. User Management → Update Location
7. User Management → Upload Profile Photo
8. User Management → Add Interests
```

#### 3️⃣ **Start Matching**
```
9. Matching → Discover Potential Matches
   - Shows users with compatibility scores
   
10. Matching → Like User (use a user_id from discover)
    - If mutual match, match_id is auto-set
    
11. Matching → Get My Matches
    - View all your matches
```

#### 4️⃣ **Chat with Match**
```
12. Messages → Send Text Message
    - Use the match_id variable
    
13. Messages → Get Messages
14. Messages → Add Reaction
15. Messages → Mark Messages as Read
```

#### 5️⃣ **Browse Properties**
```
16. Properties → Search Properties
17. Properties → Get Property Details
18. Properties → Like Property
19. Properties → Get Liked Properties
```

#### 6️⃣ **Play Games**
```
20. Games → Get All Games
21. Games → Create Game Session
22. Games → Submit Score
23. Games → Get Game Leaderboard
```

#### 7️⃣ **Join Challenges**
```
24. Challenges → Get Active Challenges
25. Challenges → Join Challenge
26. Challenges → Update Challenge Progress
```

---

## 🔑 Authentication Headers

### Automatic Token Management
The collection automatically manages tokens:
- After **Register** or **Login**: access_token is saved
- All protected endpoints use: `Authorization: Bearer {{access_token}}`
- When token expires: Use **Refresh Token** endpoint

### Manual Token Update (if needed)
1. Click collection name
2. Variables tab
3. Update `access_token` value
4. Click Save

---

## 📝 Request Examples

### Text Examples

**Register:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1995-05-15",
  "gender": "male"
}
```

**Update Preferences:**
```json
{
  "budget": {
    "min": 1000,
    "max": 2000,
    "currency": "USD"
  },
  "moveInDate": "2024-02-01",
  "leaseDuration": 12,
  "roomType": "private",
  "petFriendly": true
}
```

**Send Message:**
```json
{
  "matchId": "{{match_id}}",
  "receiverId": "USER_ID_HERE",
  "type": "text",
  "content": "Hey! How are you?"
}
```

### File Upload Examples

**Upload Profile Photo:**
- Method: POST
- Body type: form-data
- Key: `photo`, Type: File
- Select image file

**Send Image Message:**
- Method: POST
- Body type: form-data
- Keys:
  - `matchId`: {{match_id}} (text)
  - `receiverId`: USER_ID (text)
  - `type`: image (text)
  - `media`: Select file

---

## 🎯 Collection Organization

### 8 Main Folders:

1. **Authentication** (8 endpoints)
   - Register, Login, Refresh Token, Logout, etc.

2. **User Management** (13 endpoints)
   - Profile, Preferences, Photos, Location, etc.

3. **Matching** (7 endpoints)
   - Discover, Like, Pass, Get Matches, etc.

4. **Messages** (9 endpoints)
   - Send, Receive, Reactions, Search, etc.

5. **Properties** (9 endpoints)
   - Create, Search, Like, Update, Delete

6. **Games** (9 endpoints)
   - List, Sessions, Scores, Leaderboards

7. **Challenges** (6 endpoints)
   - Active, Join, Progress, Leaderboards

8. **Health Check** (1 endpoint)
   - Server status

---

## 🧪 Testing Tips

### Quick Test Sequence
```
1. Health Check (verify server is running)
2. Register User (creates account + auto-login)
3. Get Current User (verify token works)
4. Update Profile (add bio, occupation)
5. Update Location (set coordinates)
6. Discover Matches (see compatible users)
```

### Common Variables to Replace
- `USER_ID_HERE` - Replace with actual user ID
- `MESSAGE_ID_HERE` - Replace with actual message ID
- `SESSION_ID_HERE` - Replace with actual game session ID

### Status Codes Reference
- **200** - Success
- **201** - Created
- **400** - Bad Request (check body)
- **401** - Unauthorized (token expired/invalid)
- **404** - Not Found
- **409** - Conflict (duplicate)
- **500** - Server Error

---

## 🔄 Environment Setup

### Create Multiple Environments

**Local Development:**
```
base_url: http://localhost:5000/api/v1
```

**Staging:**
```
base_url: https://staging-api.roomie.com/api/v1
```

**Production:**
```
base_url: https://api.roomie.com/api/v1
```

To switch environments:
1. Top-right corner of Postman
2. Select environment from dropdown

---

## 📊 Pre-request Scripts

Some requests have scripts that auto-populate variables:
- **Register/Login**: Saves tokens and user_id
- **Like User**: Saves match_id if match occurs
- **Create Property**: Saves property_id

---

## 🐛 Troubleshooting

### Token Expired (401 Error)
```
Solution: Use "Refresh Token" endpoint
Location: Authentication → Refresh Token
```

### Server Not Running (Connection Error)
```
1. Check if server is running: npm start
2. Verify base_url is correct
3. Check Health Check endpoint
```

### Missing Variable Values
```
1. Click collection name
2. Variables tab
3. Verify values are populated
4. Run Register/Login again if needed
```

### File Upload Not Working
```
1. Check Content-Type is NOT set (Postman auto-sets)
2. Verify file size < 50MB
3. Check file format (JPG, PNG, WEBP, MP4)
```

---

## 💡 Pro Tips

1. **Save Test Data**: Create environment with test user credentials
2. **Use Folders**: Run entire folder to test all endpoints
3. **Collection Runner**: Test multiple scenarios automatically
4. **Monitor**: Use Postman Monitor for uptime checks
5. **Documentation**: Generate API docs from collection
6. **Mock Server**: Create mock server for frontend testing

---

## 📚 Additional Resources

- **API Documentation**: See `API_DOCUMENTATION.md`
- **Feature List**: See `FEATURES.md`
- **Deployment Guide**: See `DEPLOYMENT.md`

---

## ✅ Testing Checklist

- [ ] Health check passes
- [ ] Can register new user
- [ ] Can login existing user
- [ ] Can update profile
- [ ] Can upload photos
- [ ] Can discover matches
- [ ] Can like/match users
- [ ] Can send messages
- [ ] Can search properties
- [ ] Can create game sessions
- [ ] Can join challenges

---

## 🎉 You're Ready!

Import the collection and start testing all 70+ endpoints!

**Questions?** Check the main README.md or API_DOCUMENTATION.md

---

**Last Updated:** December 2024
**Collection Version:** 1.0.0
