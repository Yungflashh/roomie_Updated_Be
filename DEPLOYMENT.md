# 🚀 Deployment Guide - Roomie Backend

## Quick Deploy to Render.com (Recommended for MVP)

### Prerequisites
- GitHub account
- Render.com account (free tier available)
- MongoDB Atlas account (free tier available)
- Redis Cloud account (free tier available)

### Step 1: Prepare MongoDB Atlas
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create database user
4. Whitelist all IPs (0.0.0.0/0) for Render
5. Get connection string: `mongodb+srv://<user>:<password>@cluster.mongodb.net/roomie`

### Step 2: Prepare Redis Cloud
1. Go to https://redis.com/try-free/
2. Create free database
3. Get connection details (host, port, password)

### Step 3: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 4: Deploy on Render
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** roomie-api
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (or Starter for production)

### Step 5: Set Environment Variables
In Render dashboard, add these environment variables:

```env
NODE_ENV=production
PORT=5000

# MongoDB (from Atlas)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/roomie

# Redis (from Redis Cloud)
REDIS_HOST=redis-xxxxx.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your-redis-password

# JWT Secrets (generate strong random strings)
JWT_SECRET=your-super-secret-production-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-production-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Client URL
CLIENT_URL=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE_MB=50
MAX_PROFILE_PHOTOS=10
```

### Step 6: Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Your API will be available at: `https://roomie-api.onrender.com`

### Step 7: Test
```bash
curl https://roomie-api.onrender.com/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Alternative: Deploy to AWS

### Architecture
```
┌─────────────────┐
│  CloudFront CDN │
└────────┬────────┘
         │
┌────────▼────────┐
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
┌───▼──┐  ┌──▼───┐
│ EC2-1│  │ EC2-2│
└───┬──┘  └──┬───┘
    └────┬────┘
         │
    ┌────▼────┐
    │ MongoDB │
    │  Cluster│
    └─────────┘
```

### Step 1: Launch EC2 Instance
```bash
# Ubuntu 22.04 LTS
# t3.small (minimum for production)

sudo apt update
sudo apt install -y nodejs npm nginx
```

### Step 2: Install Application
```bash
cd /var/www
git clone <your-repo>
cd roomie-backend
npm install
npm run build
```

### Step 3: Setup PM2
```bash
npm install -g pm2
pm2 start dist/index.js --name roomie-api
pm2 startup
pm2 save
```

### Step 4: Configure Nginx
```nginx
# /etc/nginx/sites-available/roomie
server {
    listen 80;
    server_name api.roomie.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/roomie /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: SSL Certificate
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.roomie.com
```

### Step 6: MongoDB Setup (AWS DocumentDB)
1. Create DocumentDB cluster
2. Configure security groups
3. Update `MONGODB_URI` in `.env`

### Step 7: Redis Setup (AWS ElastiCache)
1. Create Redis cluster
2. Configure VPC and security groups
3. Update Redis config in `.env`

---

## Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/roomie
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  mongo-data:
```

### Deploy
```bash
docker-compose up -d
```

---

## Environment-Specific Configurations

### Development
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/roomie
REDIS_HOST=localhost
```

### Staging
```env
NODE_ENV=staging
PORT=5000
MONGODB_URI=mongodb+srv://staging-cluster...
REDIS_HOST=staging-redis.cloud.com
```

### Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://prod-cluster...
REDIS_HOST=prod-redis.cloud.com
# + All OAuth, payment keys
```

---

## Monitoring & Logging

### PM2 Monitoring
```bash
pm2 monit
pm2 logs roomie-api
pm2 restart roomie-api
```

### Application Logs
- Location: `/var/www/roomie-backend/logs/`
- Error log: `error.log`
- Combined log: `combined.log`

### Health Check Endpoint
```bash
curl https://api.roomie.com/api/v1/health
```

---

## Backup Strategy

### MongoDB Backups
```bash
# Daily automated backups
0 2 * * * mongodump --uri="$MONGODB_URI" --out=/backups/$(date +\%Y\%m\%d)
```

### S3 Backup Upload
```bash
aws s3 sync /backups s3://roomie-backups/mongodb/
```

---

## Scaling Considerations

### Horizontal Scaling
1. Add more EC2 instances
2. Configure load balancer
3. Use Redis for session management
4. Shared file storage (S3/EFS)

### Vertical Scaling
1. Upgrade instance type
2. Increase MongoDB cluster size
3. Add Redis replicas

### Performance Optimization
- Enable MongoDB indexes
- Use Redis caching
- CDN for static assets
- Image optimization (Sharp)
- Connection pooling

---

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check connection string
echo $MONGODB_URI

# Test connection
mongosh "$MONGODB_URI"
```

**Redis Connection Failed**
```bash
# Check Redis is running
redis-cli -h $REDIS_HOST -p $REDIS_PORT ping
```

**Port Already in Use**
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

**High Memory Usage**
```bash
# Check PM2 processes
pm2 list
pm2 restart roomie-api

# Check system resources
htop
```

---

## Security Checklist

- [ ] Environment variables secured
- [ ] JWT secrets are strong (32+ characters)
- [ ] MongoDB authentication enabled
- [ ] Redis password set
- [ ] HTTPS/SSL configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] File upload limits set
- [ ] Input validation active
- [ ] Error messages don't leak sensitive info

---

## Support

For deployment issues:
- Check logs: `pm2 logs roomie-api`
- Review environment variables
- Test database connections
- Check firewall rules
- Verify SSL certificates

---

**Last Updated:** December 2024
