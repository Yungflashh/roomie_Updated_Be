# 🧪 Testing Guide - Roomie API

## 📋 Table of Contents
1. [Postman Collection Setup](#postman-collection-setup)
2. [Database Seeding](#database-seeding)
3. [Testing Workflow](#testing-workflow)
4. [Test User Credentials](#test-user-credentials)
5. [Common Test Scenarios](#common-test-scenarios)

---

## 📬 Postman Collection Setup

### Step 1: Import Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select **File** tab
4. Choose `Roomie-API.postman_collection.json`
5. Click **Import**

### Step 2: Configure Environment

The collection uses variables that auto-update:
- `base_url` - API base URL (default: http://localhost:5000/api/v1)
- `access_token` - Auto-set after login
- `refresh_token` - Auto-set after login
- `user_id` - Auto-set after registration/login
- `match_id` - Auto-set after matching
- `property_id` - Auto-set after creating property

**To change base URL:**
1. Click collection name
2. Go to **Variables** tab
3. Update `base_url` value
4. Save

### Step 3: Collection Structure

```
Roomie API Collection
├── 1. Authentication (8 requests)
├── 2. User Management (10 requests)
├── 3. Matching System (7 requests)
├── 4. Messaging (8 requests)
├── 5. Properties (8 requests)
├── 6. Games (9 requests)
├── 7. Challenges (6 requests)
└── 8. Health Check (1 request)
```

**Total: 57+ API requests ready to test!**

---

## 🌱 Database Seeding

### Prerequisites

Make sure MongoDB is running:
```bash
# Check MongoDB status
mongosh

# If not running, start it
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

### Run Seed Script

```bash
# Navigate to project root
cd roomie-backend

# Run seed script
npx ts-node scripts/seed.ts
```

### What Gets Created

The seed script creates:

**5 Test Users:**
1. **John Doe** - Software Engineer
   - Email: john.doe@example.com
   - Interests: hiking, coding, reading
   - Budget: $800-$1500

2. **Jane Smith** - Marketing Manager
   - Email: jane.smith@example.com
   - Interests: yoga, cooking, travel
   - Budget: $1000-$1800

3. **Mike Johnson** - Graduate Student
   - Email: mike.johnson@example.com
   - Interests: basketball, gaming, movies
   - Budget: $600-$1200

4. **Sarah Williams** - Graphic Designer
   - Email: sarah.williams@example.com
   - Interests: art, coffee, design
   - Budget: $900-$1600

5. **Alex Brown** - Music Teacher
   - Email: alex.brown@example.com
   - Interests: music, meditation, books
   - Budget: $700-$1300

**Password for all users:** `Password123!`

**4 Properties:**
- 2BR Apartment in Downtown Manhattan ($2200/mo)
- 1BR in Brooklyn Heights ($1800/mo)
- 3BR House in Queens ($2800/mo)
- Studio in Midtown ($2500/mo)

**5 Games:**
- Trivia Master
- Word Scramble
- Memory Match
- Speed Math
- Emoji Guess

**5 Challenges:**
- Daily: Match Master (Get 5 matches)
- Daily: Chat Champion (Send 20 messages)
- Weekly: Social Butterfly (Get 20 matches)
- Weekly: Property Hunter (View 30 properties)
- Weekly: Game Master (Win 10 games)

---

## 🔄 Testing Workflow

### Quick Start (5 Minutes)

1. **Start Server:**
```bash
npm start
```

2. **Test Health Check:**
   - Open Postman
   - Run: `Health Check` request
   - Should return: `"success": true`

3. **Register/Login:**
   - Run: `1. Authentication → Register User`
   - OR Run: `1. Authentication → Login` with seed user
   - Access token auto-saves!

4. **Test Features:**
   - All authenticated requests now work automatically
   - Tokens refresh automatically

### Recommended Test Order

#### Day 1: Basic Features
```
1. Authentication → Register User
2. Authentication → Get Current User
3. User Management → Update Profile
4. User Management → Update Preferences
5. User Management → Update Location
6. User Management → Add Interests
```

#### Day 2: Matching & Chat
```
1. Matching System → Discover Potential Matches
2. Matching System → Like User (Swipe Right)
3. Matching System → Get My Matches
4. Messaging → Send Text Message
5. Messaging → Get Messages
6. Messaging → Add Reaction
```

#### Day 3: Properties & Gamification
```
1. Properties → Search Properties
2. Properties → Get Property Details
3. Properties → Like Property
4. Games → Get All Games
5. Games → Create Game Session
6. Challenges → Get Active Challenges
7. Challenges → Join Challenge
```

---

## 👤 Test User Credentials

All test users have the same password: **Password123!**

### User 1 - John Doe
```json
{
  "email": "john.doe@example.com",
  "password": "Password123!"
}
```
- Location: New York, NY
- Compatibility: High with Jane & Sarah

### User 2 - Jane Smith
```json
{
  "email": "jane.smith@example.com",
  "password": "Password123!"
}
```
- Location: New York, NY
- Compatibility: High with John & Sarah

### User 3 - Mike Johnson
```json
{
  "email": "mike.johnson@example.com",
  "password": "Password123!"
}
```
- Location: New York, NY
- Compatibility: Moderate with all

### User 4 - Sarah Williams
```json
{
  "email": "sarah.williams@example.com",
  "password": "Password123!"
}
```
- Location: New York, NY
- Compatibility: High with John & Jane

### User 5 - Alex Brown
```json
{
  "email": "alex.brown@example.com",
  "password": "Password123!"
}
```
- Location: New York, NY
- Compatibility: Moderate with all

---

## 🎯 Common Test Scenarios

### Scenario 1: Complete User Journey

```
1. Register new user
2. Update profile & preferences
3. Update location
4. Add interests
5. Upload profile photo
6. Discover matches
7. Like potential roommates
8. Send messages to matches
9. Search properties
10. Like properties
```

### Scenario 2: Matching Flow

```
1. Login as User 1 (John)
2. Discover matches → Get User 2 (Jane)
3. Like Jane
4. Login as User 2 (Jane)
5. Discover matches → Get User 1 (John)
6. Like John
7. ✅ Match created!
8. Send messages to each other
```

### Scenario 3: Property Search

```
1. Login as any user
2. Update location (set to New York)
3. Search properties with filters:
   - Price: $1000-$2500
   - Bedrooms: 1-2
   - Radius: 10km
4. View property details
5. Like interesting properties
6. View liked properties list
```

### Scenario 4: Gamification

```
1. Login as user
2. Get all available games
3. Create game session
4. Submit score
5. Complete game
6. View game leaderboard
7. Join daily challenge
8. Update challenge progress
9. Check points & level
```

---

## 🔍 Testing Tips

### Auto-Testing Features

The collection includes **test scripts** that:
- ✅ Auto-save access tokens
- ✅ Auto-save refresh tokens
- ✅ Auto-save user IDs
- ✅ Auto-save match IDs
- ✅ Auto-save property IDs

**You don't need to copy/paste tokens manually!**

### File Upload Testing

For endpoints with file uploads:

1. **Profile Photo Upload:**
   - Go to `User Management → Upload Profile Photo`
   - Body → form-data
   - Key: `photo`, Type: File
   - Click "Select Files"

2. **Image Message:**
   - Go to `Messaging → Send Image Message`
   - Update `matchId` and `receiverId`
   - Select image file

### Variable Substitution

The collection uses variables like `{{match_id}}`. These auto-fill when:
- You create a match
- You create a property
- You login/register

**Manual override:** Edit collection variables if needed.

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" Error

**Solution:**
```
1. Run: Authentication → Login
2. Check access_token is saved (Collection Variables)
3. Retry failed request
```

### Issue: "Match not found"

**Solution:**
```
1. Create a match first:
   - Discover matches
   - Like a user
   - Have them like you back
2. The match_id will auto-save
```

### Issue: "Property not found"

**Solution:**
```
1. Run: Properties → Search Properties
2. Copy a property ID from response
3. Use it in Get Property Details
```

### Issue: Database connection error

**Solution:**
```bash
# Check MongoDB is running
mongosh

# If not, start it
brew services start mongodb-community
```

### Issue: Seed script fails

**Solution:**
```bash
# Clear database manually
mongosh
use roomie
db.dropDatabase()

# Run seed again
npx ts-node scripts/seed.ts
```

---

## 📊 Expected Results

### Compatibility Scores

When users discover matches, they'll see scores like:
- John ↔ Jane: ~75-85% (similar interests, budget overlap)
- John ↔ Mike: ~50-60% (different lifestyles)
- Jane ↔ Sarah: ~70-80% (similar interests, location close)

### Response Times

Typical response times:
- Authentication: < 200ms
- User operations: < 150ms
- Matching (with AI): < 300ms
- Property search: < 200ms
- Message operations: < 100ms

---

## 🎓 Learning Resources

### Understanding the API

1. **API Documentation:** See `API_DOCUMENTATION.md`
2. **Features List:** See `FEATURES.md`
3. **Architecture:** See `PROJECT_STRUCTURE.md`

### Test Data Locations

```
Users: MongoDB → roomie.users
Properties: MongoDB → roomie.properties
Matches: MongoDB → roomie.matches
Messages: MongoDB → roomie.messages
Games: MongoDB → roomie.games
Challenges: MongoDB → roomie.challenges
```

### Viewing Data

```bash
# Connect to MongoDB
mongosh

# Switch to roomie database
use roomie

# View collections
show collections

# View users
db.users.find().pretty()

# Count documents
db.users.countDocuments()
```

---

## ✅ Testing Checklist

### Authentication ✓
- [ ] Register new user
- [ ] Login existing user
- [ ] Get current user profile
- [ ] Refresh access token
- [ ] Change password
- [ ] Logout

### User Management ✓
- [ ] Get user profile
- [ ] Update profile info
- [ ] Update preferences
- [ ] Update lifestyle
- [ ] Update location
- [ ] Upload profile photo
- [ ] Add photos to gallery
- [ ] Add interests
- [ ] Block user
- [ ] Report user

### Matching ✓
- [ ] Discover potential matches
- [ ] View compatibility scores
- [ ] Like user (swipe right)
- [ ] Pass user (swipe left)
- [ ] Create mutual match
- [ ] Get all matches
- [ ] Get match details
- [ ] Unmatch user
- [ ] View received likes

### Messaging ✓
- [ ] Send text message
- [ ] Send image message
- [ ] Get message history
- [ ] Mark messages as read
- [ ] Add emoji reaction
- [ ] Delete message
- [ ] Search messages
- [ ] Check unread count

### Properties ✓
- [ ] Create property listing
- [ ] Search with filters
- [ ] Get property details
- [ ] Update property
- [ ] Like property
- [ ] View liked properties
- [ ] Get my properties
- [ ] Delete property

### Games ✓
- [ ] Get all games
- [ ] Create game session
- [ ] Join game session
- [ ] Start game
- [ ] Submit score
- [ ] Complete game
- [ ] View leaderboard
- [ ] Check game history

### Challenges ✓
- [ ] Get active challenges
- [ ] Join challenge
- [ ] Update progress
- [ ] Complete challenge
- [ ] View leaderboard
- [ ] Check my challenges

---

## 🎉 Success!

You now have:
- ✅ 57+ ready-to-use API requests
- ✅ 5 test users with different profiles
- ✅ 4 properties to search
- ✅ 5 games to play
- ✅ 5 challenges to complete
- ✅ Auto-token management
- ✅ Complete test data

**Happy Testing! 🚀**

---

**Need Help?**
- Check: `API_DOCUMENTATION.md` for endpoint details
- Check: `README.md` for setup issues
- Check: `DEPLOYMENT.md` for environment config

**Last Updated:** December 2024
