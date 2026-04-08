# Quick Setup: MongoDB Atlas + Redis (Upstash)

## 🚀 Quick Start (5 minutes)

### 1. MongoDB Atlas

```bash
# Get your connection string from MongoDB Atlas:
# 1. Create cluster at https://cloud.mongodb.com
# 2. Add IP: 0.0.0.0/0 (Network Access)
# 3. Create user (Database Access)
# 4. Get connection string (Connect > Drivers)
```

**Connection String Format:**

```
mongodb+srv://username:password@cluster.mongodb.net/growthCraft?retryWrites=true&w=majority
```

### 2. Redis (Upstash)

```bash
# Get your Redis URL from Upstash:
# 1. Create database at https://upstash.com
# 2. Copy connection URL from dashboard
```

**Connection URL Format:**

```
rediss://default:password@endpoint.upstash.io:6379
```

### 3. Update `.env`

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://your-user:your-pass@cluster.mongodb.net/growthCraft?retryWrites=true&w=majority

# Redis Upstash
REDIS_URL=rediss://default:your-pass@endpoint.upstash.io:6379
```

### 4. Start Server

```bash
npm run dev
```

### 5. Verify

```bash
# Check logs for:
✓ MongoDB connected
✓ Redis connected successfully
✓ Server running on port 5001

# Test health endpoint:
curl http://localhost:5001/health
```

---

## 📋 Checklist

- [ ] MongoDB Atlas cluster created
- [ ] IP address whitelisted (0.0.0.0/0 for dev)
- [ ] Database user created
- [ ] Connection string copied
- [ ] Upstash Redis database created
- [ ] Redis URL copied
- [ ] `.env` file updated
- [ ] Server starts without errors
- [ ] Health endpoint returns 200

---

## 🔧 Common Issues

**MongoDB won't connect?**

- Check username/password in connection string
- Verify IP whitelist includes your IP
- Ensure cluster is active

**Redis won't connect?**

- Use `rediss://` (with TLS) for Upstash
- Verify password is correct
- Check Upstash database is active

**App works but Redis shows warning?**

- This is OK! Redis is optional
- App will continue without Redis features

---

## 📚 Full Documentation

See `MONGODB_REDIS_SETUP.md` for detailed instructions.

---

## 🎯 What's Next?

1. Test authentication endpoints
2. Create a test user
3. Verify data in MongoDB Atlas dashboard
4. Monitor Redis in Upstash dashboard
