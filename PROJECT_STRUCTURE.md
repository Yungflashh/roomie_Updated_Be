# 📂 Roomie Backend - Project Structure

## Complete File Organization

```
roomie-backend/
├── src/                              # TypeScript source code
│   ├── config/                       # Configuration files
│   │   ├── database.ts              # MongoDB connection
│   │   └── redis.ts                 # Redis configuration
│   │
│   ├── controllers/                  # Request handlers (thin layer)
│   │   ├── auth.controller.ts       # Authentication endpoints
│   │   ├── user.controller.ts       # User management endpoints
│   │   ├── match.controller.ts      # Matching system endpoints
│   │   ├── message.controller.ts    # Chat endpoints
│   │   └── property.controller.ts   # Property listing endpoints
│   │
│   ├── services/                     # Business logic layer
│   │   ├── auth.service.ts          # Authentication logic
│   │   ├── user.service.ts          # User management logic
│   │   ├── match.service.ts         # Matching logic
│   │   ├── message.service.ts       # Chat logic
│   │   ├── property.service.ts      # Property logic
│   │   ├── compatibility.service.ts # AI matching algorithm
│   │   └── duplicateDetection.service.ts # Media deduplication
│   │
│   ├── models/                       # MongoDB schemas
│   │   ├── User.ts                  # User model
│   │   ├── Property.ts              # Property model
│   │   ├── Match.ts                 # Match model
│   │   ├── Message.ts               # Message model
│   │   ├── MediaHash.ts             # Media hash model
│   │   ├── Game.ts                  # Game & GameSession models
│   │   ├── Challenge.ts             # Challenge model
│   │   ├── Transaction.ts           # Transaction & Notification models
│   │   ├── Leaderboard.ts           # Leaderboard model
│   │   └── index.ts                 # Model exports
│   │
│   ├── routes/                       # API route definitions
│   │   ├── auth.routes.ts           # /api/v1/auth/*
│   │   ├── user.routes.ts           # /api/v1/users/*
│   │   ├── match.routes.ts          # /api/v1/matches/*
│   │   ├── message.routes.ts        # /api/v1/messages/*
│   │   ├── property.routes.ts       # /api/v1/properties/*
│   │   └── index.ts                 # Route aggregator
│   │
│   ├── middleware/                   # Express middleware
│   │   ├── auth.middleware.ts       # JWT authentication
│   │   ├── error.middleware.ts      # Error handling
│   │   ├── validation.middleware.ts # Request validation
│   │   ├── upload.middleware.ts     # File upload + duplicate check
│   │   └── index.ts                 # Middleware exports
│   │
│   ├── validation/                   # Validation schemas
│   │   └── schemas.ts               # Express-validator schemas
│   │
│   ├── utils/                        # Utility functions
│   │   ├── logger.ts                # Winston logger setup
│   │   └── jwt.ts                   # JWT utilities
│   │
│   ├── types/                        # TypeScript types
│   │   └── index.ts                 # Type definitions & interfaces
│   │
│   ├── jobs/                         # Background jobs (ready)
│   ├── scripts/                      # Utility scripts (ready)
│   ├── sockets/                      # Socket.io handlers (ready)
│   │
│   ├── app.ts                        # Express app configuration
│   └── index.ts                      # Server entry point
│
├── public/                           # Static files
│   ├── uploads/                      # Uploaded media
│   │   ├── profiles/                # Profile photos
│   │   ├── properties/              # Property photos
│   │   ├── chat/                    # Chat media
│   │   └── temp/                    # Temporary files
│   └── cdn/                          # CDN-ready assets
│
├── logs/                             # Application logs
│   ├── error.log                    # Error logs
│   └── combined.log                 # Combined logs
│
├── dist/                             # Compiled JavaScript (build output)
│
├── .env                              # Environment variables (local)
├── .env.example                      # Environment variables template
├── .gitignore                        # Git ignore rules
├── tsconfig.json                     # TypeScript configuration
├── package.json                      # NPM dependencies & scripts
├── README.md                         # Project documentation
└── PROJECT_STRUCTURE.md              # This file
```

## 📊 Statistics

- **Total Files:** 41 TypeScript files
- **Controllers:** 5 files (auth, user, match, message, property)
- **Services:** 7 files (business logic layer)
- **Models:** 9 files (MongoDB schemas)
- **Routes:** 6 files (API endpoints)
- **Middleware:** 5 files (auth, error, validation, upload, index)
- **Utilities:** 2 files (logger, jwt)

## 🎯 Architecture Principles

### 1. **Separation of Concerns**
```
Request → Route → Middleware → Controller → Service → Model → Database
```

### 2. **Layer Responsibilities**

**Controllers (Request Layer)**
- Parse request data
- Call appropriate service methods
- Format responses
- Handle HTTP status codes

**Services (Business Logic Layer)**
- Core business logic
- Data transformation
- External API calls
- Complex computations
- Transaction management

**Models (Data Layer)**
- Database schema definitions
- Data validation
- Pre/post hooks
- Instance methods

### 3. **Data Flow**

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────┐
│   Routes    │ (URL mapping)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Middleware  │ (Auth, Validation, Upload)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controllers │ (Request handling)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Services   │ (Business logic)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Models    │ (Data access)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Database   │ (MongoDB)
└─────────────┘
```

## 🔐 Security Layers

1. **Authentication Middleware** - JWT verification
2. **Validation Middleware** - Input sanitization
3. **Rate Limiting** - DDoS protection
4. **Duplicate Detection** - Media integrity
5. **Error Handling** - Secure error messages

## 📈 Scalability Features

- **Stateless Architecture** - Horizontal scaling ready
- **Redis Caching** - Performance optimization
- **Connection Pooling** - Database efficiency
- **Indexed Queries** - Fast data retrieval
- **Modular Design** - Easy to extend

## 🚀 Deployment Structure

```
Production Environment:
├── Load Balancer (Nginx)
├── App Server 1 (PM2)
├── App Server 2 (PM2)
├── MongoDB Cluster
├── Redis Cluster
└── CDN (Cloudflare/CloudFront)
```

## 🔄 Request Lifecycle Example

**Scenario:** User sends a message

```typescript
1. POST /api/v1/messages
   ↓
2. authenticate middleware (verify JWT)
   ↓
3. validate(sendMessageValidation) (check request body)
   ↓
4. upload.single('media') (handle file upload)
   ↓
5. checkImageDuplicate (verify not duplicate)
   ↓
6. messageController.sendMessage() (parse request)
   ↓
7. messageService.sendMessage() (business logic)
   ↓
8. Message.create() (save to database)
   ↓
9. Match.findByIdAndUpdate() (update match)
   ↓
10. Response sent to client
```

## 📝 Naming Conventions

- **Files:** camelCase with `.ts` extension
- **Classes:** PascalCase (e.g., `UserController`)
- **Functions:** camelCase (e.g., `getUserProfile`)
- **Constants:** UPPER_SNAKE_CASE
- **Interfaces:** PascalCase with `I` prefix (e.g., `IUser`)
- **Types:** PascalCase

## 🎨 Code Style

- **Indentation:** 2 spaces
- **Quotes:** Single quotes
- **Semicolons:** Required
- **Max line length:** 100 characters
- **Arrow functions:** Preferred
- **Async/await:** Preferred over promises

---

**Last Updated:** December 2024
**Version:** 1.0.0
