# 🚀 Setup Instructions: MongoDB Atlas + Redis (Upstash)

## What I've Done

I've configured your backend to connect to:

- ✅ MongoDB Atlas (cloud MongoDB database)
- ✅ Redis via Upstash (cloud Redis database)

The code is ready. Now you just need to get your connection credentials and update the `.env` file.

---

## What You Need To Do

### Step 1: Get MongoDB Atlas Connection String

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com
2. **Sign up/Login** to your account
3. **Create a Cluster**:
   - Click "Build a Database"
   - Choose "Free" (M0) tier
   - Select a cloud provider and region
   - Click "Create"
4. **Setup Network Access**:
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"
5. **Create Database User**:
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Enter username and password (save these!)
   - Select "Read and write to any database"
   - Click "Add User"
6. **Get Connection String**:
   - Go back to "Database" in left sidebar
   - Click "Connect" button on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/`

### Step 2: Get Redis (Upstash) Connection URL

1. **Go to Upstash**: https://upstash.com
2. **Sign up/Login** to your account
3. **Create Redis Database**:
   - Click "Create Database"
   - Enter name: `growthcraft-redis`
   - Choose region (closest to you)
   - Select "Regional" type
   - Enable TLS
   - Click "Create"
4. **Get Connection URL**:
   - Click on your database
   - Copy the connection URL from the dashboard
   - It looks like: `rediss://default:password@endpoint.upstash.io:6379`

### Step 3: Update Your `.env` File

Open `backend/.env` and update these lines:

```env
# Replace this line:
MONGODB_URI=mongodb://localhost:27017/growthCraft

# With your MongoDB Atlas connection string:
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/growthCraft?retryWrites=true&w=majority

# Replace this line:
REDIS_URL=redis://localhost:6379

# With your Upstash Redis URL:
REDIS_URL=rediss://default:your-password@endpoint.upstash.io:6379
```

**Important**:

- Replace `<username>` and `<password>` in MongoDB string with your actual credentials
- Add `/growthCraft` after `.mongodb.net` to specify your database name
- Make sure Redis URL starts with `rediss://` (double 's' for TLS)

### Step 4: Test Your Connections

Run the test script:

```bash
cd backend
npm run test:connections
```

You should see:

```
✅ MongoDB connected successfully!
✅ Redis connected successfully!
🎉 All required connections successful!
```

### Step 5: Start Your Server

```bash
npm run dev
```

Check the logs for:

```
✓ MongoDB connected: mongodb+srv://...
✓ Redis connected successfully
✓ Server running on port 5001
```

### Step 6: Verify Everything Works

Test the health endpoint:

```bash
curl http://localhost:5001/health
```

Or open in browser: http://localhost:5001/health

---

## 📁 Files I Created/Updated

1. **`backend/src/config/redis.config.ts`** - Redis connection configuration
2. **`backend/src/server.ts`** - Updated to connect to Redis on startup
3. **`backend/.env.example`** - Updated with better instructions
4. **`backend/scripts/test-connections.js`** - Test script for connections
5. **`backend/MONGODB_REDIS_SETUP.md`** - Detailed setup guide
6. **`backend/QUICK_SETUP_MONGODB_REDIS.md`** - Quick reference
7. **`backend/SETUP_INSTRUCTIONS.md`** - This file

---

## 🆘 Troubleshooting

### MongoDB Issues

**"MongoServerError: bad auth"**

- Check your username and password are correct
- Make sure you're using the database user credentials

**"MongooseServerSelectionError"**

- Check your IP is whitelisted in Network Access
- Try using 0.0.0.0/0 for development

### Redis Issues

**"ECONNREFUSED"**

- Verify your Upstash URL is correct
- Make sure you're using `rediss://` (with TLS)

**Redis warning but app still works**

- This is normal! Redis is optional
- The app will work without Redis

---

## 📚 Documentation

- **Quick Setup**: `QUICK_SETUP_MONGODB_REDIS.md`
- **Detailed Guide**: `MONGODB_REDIS_SETUP.md`
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com/
- **Upstash Docs**: https://docs.upstash.com/redis

---

## ✅ Checklist

- [ ] MongoDB Atlas account created
- [ ] MongoDB cluster created
- [ ] IP address whitelisted
- [ ] Database user created
- [ ] MongoDB connection string copied
- [ ] Upstash account created
- [ ] Redis database created
- [ ] Redis URL copied
- [ ] `.env` file updated with both connection strings
- [ ] Ran `npm run test:connections` successfully
- [ ] Server starts with `npm run dev`
- [ ] Health endpoint returns 200

---

## 🎉 You're Done!

Once all checkboxes are complete, your backend is connected to MongoDB Atlas and Redis (Upstash)!

You can now:

- Create users via the API
- View data in MongoDB Atlas dashboard
- Monitor Redis usage in Upstash dashboard
- Deploy your application

Need help? Check the detailed guide in `MONGODB_REDIS_SETUP.md`
