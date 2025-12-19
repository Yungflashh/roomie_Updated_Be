# 🚀 QUICK START GUIDE - 5 Minutes to Testing!

## ⚡ Super Quick Setup

### 1. Extract & Install (2 minutes)
```bash
# Extract ZIP
unzip roomie-backend-complete.zip
cd roomie-backend

# Install dependencies
npm install
```

### 2. Configure Environment (1 minute)
```bash
# Copy environment template
cp .env.example .env

# Edit .env (add your MongoDB URI)
nano .env
```

**Minimum required in .env:**
```env
MONGODB_URI=mongodb://localhost:27017/roomie
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key-min-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-min-32-characters
```

### 3. Seed Database (1 minute)
```bash
# Populate test data
npm run seed
```

**You now have:**
- ✅ 5 test users
- ✅ 4 properties
- ✅ 5 games
- ✅ 5 challenges

### 4. Start Server (30 seconds)
```bash
# Build and start
npm run build
npm start
```

### 5. Test with Postman (30 seconds)
1. Open Postman
2. Import `Roomie-API.postman_collection.json`
3. Run "Health Check" → ✅ Success!
4. Run "Login" with: `john.doe@example.com` / `Password123!`
5. All other requests now work automatically!

---

## 🎯 Test User Credentials

**All users have the same password:** `Password123!`

```
1. john.doe@example.com     - Software Engineer
2. jane.smith@example.com   - Marketing Manager
3. mike.johnson@example.com - Graduate Student
4. sarah.williams@example.com - Graphic Designer
5. alex.brown@example.com   - Music Teacher
```

---

## 📱 Quick Test Flow

### Test Authentication (1 minute)
```
1. Run: "1. Authentication → Login"
2. ✅ Access token auto-saved
3. Run: "1. Authentication → Get Current User"
4. ✅ See your profile!
```

### Test Matching (2 minutes)
```
1. Run: "3. Matching System → Discover Potential Matches"
2. ✅ See compatible users with scores
3. Copy a user ID from results
4. Run: "3. Matching System → Like User" (replace USER_ID)
5. ✅ User liked!
```

### Test Properties (1 minute)
```
1. Run: "5. Properties → Search Properties"
2. ✅ See 4 properties
3. Run: "5. Properties → Get Property Details" (use any property_id)
4. ✅ See full details!
```

### Test Games (1 minute)
```
1. Run: "6. Games → Get All Games"
2. ✅ See 5 games
3. Copy a game_id
4. Run: "6. Games → Get Game Leaderboard"
5. ✅ See rankings!
```

---

## 🎨 What's Working Right Now

### ✅ Authentication
- Register, login, logout
- JWT tokens (auto-managed)
- Password change
- Token refresh

### ✅ User Management
- Complete profiles
- Photo uploads
- Preferences
- Lifestyle
- Location
- Interests

### ✅ AI Matching
- Compatibility scoring (0-100%)
- Tinder-style swipe
- Mutual match detection
- Match management

### ✅ Real-Time Chat
- Text messages
- Image messages
- Read receipts
- Reactions
- Search

### ✅ Properties
- Create listings
- Search with filters
- Location-based search
- Like/favorites

### ✅ Gamification
- 5 games ready
- Game sessions
- Leaderboards
- 5 challenges
- Points & levels

---

## 📚 Full Documentation

- **TESTING_GUIDE.md** - Complete testing guide
- **API_DOCUMENTATION.md** - All 70+ endpoints
- **FEATURES.md** - Full feature list
- **DEPLOYMENT.md** - Production deployment
- **README.md** - Detailed setup

---

## 🐛 Troubleshooting

### MongoDB Not Running?
```bash
# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod           # Linux

# Or use Docker
docker run -d -p 27017:27017 mongo
```

### Redis Not Running?
```bash
# Start Redis
brew services start redis              # macOS
sudo systemctl start redis             # Linux

# Or use Docker
docker run -d -p 6379:6379 redis
```

### Build Errors?
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Can't Login?
```bash
# Re-run seed script
npm run seed
```

---

## 💡 Pro Tips

1. **Auto-Token Management**: Postman saves tokens automatically after login
2. **Test Order**: Follow the numbered folders (1→2→3...)
3. **Variables**: Collection variables auto-update (match_id, property_id, etc.)
4. **Multiple Users**: Login as different users to test matching
5. **Real-time**: Create matches to test messaging

---

## 🎉 You're Ready!

**In 5 minutes you have:**
- ✅ Working API server
- ✅ Test database with data
- ✅ 70+ Postman requests
- ✅ 5 test users
- ✅ Complete testing setup

### **Start Testing Now! 🚀**

Run your first test:
```
Postman → Health Check → Send
Expected: { "success": true }
```

---

**Need More Help?**
- Detailed testing: `TESTING_GUIDE.md`
- API reference: `API_DOCUMENTATION.md`
- Features list: `FEATURES.md`

**Last Updated:** December 2024
