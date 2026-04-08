# MongoDB Atlas + Redis (Upstash) Setup Guide

This guide will walk you through connecting your backend to MongoDB Atlas and Redis (Upstash).

## Prerequisites

- Node.js installed
- MongoDB Atlas account
- Upstash account (for Redis)

---

## Part 1: MongoDB Atlas Setup

### 1. Create MongoDB Atlas Account & Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Click **"Create"** to create a new cluster
4. Choose:
   - **Free Tier (M0)** for development
   - Select your preferred cloud provider and region
   - Click **"Create Cluster"**

### 2. Configure Network Access

1. In the left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. For development:
   - Click **"Allow Access from Anywhere"** (adds 0.0.0.0/0)
   - ⚠️ For production, use specific IP addresses
4. Click **"Confirm"**

### 3. Create Database User

1. In the left sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter:
   - Username: `growthcraft_user` (or your choice)
   - Password: Generate a secure password (save it!)
5. Set privileges to **"Read and write to any database"**
6. Click **"Add User"**

### 4. Get Connection String

1. Go back to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select:
   - Driver: **Node.js**
   - Version: **5.5 or later**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with your actual credentials
7. Add your database name after `.net/`:
   ```
   mongodb+srv://growthcraft_user:yourpassword@cluster0.xxxxx.mongodb.net/growthCraft?retryWrites=true&w=majority
   ```

---

## Part 2: Redis (Upstash) Setup

### 1. Create Upstash Account & Database

1. Go to [Upstash](https://upstash.com/)
2. Sign up or log in
3. Click **"Create Database"**
4. Configure:
   - **Name**: `growthcraft-redis`
   - **Type**: Regional (for lower latency) or Global (for multi-region)
   - **Region**: Choose closest to your app
   - **TLS**: Enabled (recommended)
5. Click **"Create"**

### 2. Get Redis Connection Details

1. Click on your newly created database
2. Scroll to **"REST API"** section or **"Connect"** tab
3. You'll see connection details:

   **Option A: Single URL (Recommended)**

   ```
   rediss://default:your-password@endpoint.upstash.io:6379
   ```

   **Option B: Separate credentials**
   - Endpoint: `endpoint.upstash.io`
   - Port: `6379`
   - Password: `your-password`

4. Copy the connection URL (Option A is easier)

---

## Part 3: Update Your Backend Configuration

### 1. Update `.env` File

Open `backend/.env` and update these values:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://growthcraft_user:yourpassword@cluster0.xxxxx.mongodb.net/growthCraft?retryWrites=true&w=majority
MONGODB_TEST_URI=mongodb+srv://growthcraft_user:yourpassword@cluster0.xxxxx.mongodb.net/growthCraft_test?retryWrites=true&w=majority

# Redis Configuration (Upstash)
REDIS_URL=rediss://default:your-upstash-password@endpoint.upstash.io:6379
REDIS_PASSWORD=
```

**Important Notes:**

- Replace the MongoDB connection strings with your actual Atlas connection string
- Replace the Redis URL with your actual Upstash connection string
- If using TLS (rediss://), make sure the URL starts with `rediss://` (double 's')
- The `REDIS_PASSWORD` can be left empty if it's already in the URL

### 2. Alternative Redis Configuration (Separate Credentials)

If you prefer to use separate credentials instead of a URL:

```env
# Redis Configuration (Alternative)
REDIS_URL=redis://endpoint.upstash.io:6379
REDIS_PASSWORD=your-upstash-password
```

---

## Part 4: Test Your Connections

### 1. Install Dependencies (if not already done)

```bash
cd backend
npm install
```

### 2. Start the Server

```bash
npm run dev
```

### 3. Check the Logs

You should see:

```
✓ MongoDB connected: mongodb+srv://...
✓ Redis connected successfully
✓ Server running on port 5001
```

### 4. Test Health Endpoint

Open your browser or use curl:

```bash
curl http://localhost:5001/health
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

## Part 5: Verify Database Connections

### Test MongoDB Connection

Create a test user via the API:

```bash
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Check MongoDB Atlas:

1. Go to your cluster in Atlas
2. Click **"Browse Collections"**
3. You should see your `growthCraft` database with a `users` collection

### Test Redis Connection

Redis is used automatically for:

- Session management
- Token blacklisting
- Rate limiting
- Caching

You can verify it's working by checking the logs when you make API requests.

---

## Troubleshooting

### MongoDB Connection Issues

**Error: "MongoServerError: bad auth"**

- Double-check your username and password
- Make sure you're using the database user credentials, not your Atlas account credentials

**Error: "MongooseServerSelectionError"**

- Check your IP whitelist in Network Access
- Verify your connection string is correct
- Make sure your cluster is running

**Error: "ENOTFOUND"**

- Check your internet connection
- Verify the cluster hostname in your connection string

### Redis Connection Issues

**Error: "ECONNREFUSED"**

- Verify your Upstash Redis URL is correct
- Check if you're using `rediss://` (with TLS) or `redis://`
- Ensure your Upstash database is active

**Error: "WRONGPASS"**

- Double-check your Redis password
- If using URL format, ensure password is correctly encoded

**Redis not connecting but app still works**

- This is expected! Redis is optional
- The app will log a warning and continue without Redis
- Some features (like advanced caching) won't work

---

## Security Best Practices

### For Production

1. **MongoDB Atlas:**
   - Use specific IP addresses instead of 0.0.0.0/0
   - Enable encryption at rest
   - Use strong passwords
   - Enable audit logs
   - Set up database backups

2. **Redis (Upstash):**
   - Always use TLS (rediss://)
   - Rotate passwords regularly
   - Use environment-specific databases
   - Enable eviction policies

3. **Environment Variables:**
   - Never commit `.env` files to git
   - Use different credentials for dev/staging/prod
   - Store production secrets in secure vaults (AWS Secrets Manager, etc.)

### Connection String Security

❌ **Don't do this:**

```env
MONGODB_URI=mongodb+srv://admin:password123@cluster.mongodb.net/
```

✅ **Do this:**

```env
MONGODB_URI=mongodb+srv://prod_user:Xy9$mK2#pL8@cluster.mongodb.net/growthCraft?retryWrites=true&w=majority&appName=GrowthCraft
```

---

## Additional Configuration Options

### MongoDB Connection Options

You can customize MongoDB connection in `backend/src/config/database.config.ts`:

```typescript
await mongoose.connect(mongoUri, {
  maxPoolSize: 10, // Max connections in pool
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  socketTimeoutMS: 45000, // Socket timeout
  family: 4, // Use IPv4
});
```

### Redis Connection Options

Customize Redis in `backend/src/config/redis.config.ts`:

```typescript
this.client = createClient({
  url: config.REDIS_URL,
  password: config.REDIS_PASSWORD,
  socket: {
    connectTimeout: 10000,
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
});
```

---

## Next Steps

✅ MongoDB Atlas connected
✅ Redis (Upstash) connected
✅ Backend running successfully

Now you can:

1. Test your authentication endpoints
2. Create users and verify data in MongoDB Atlas
3. Monitor Redis usage in Upstash dashboard
4. Deploy your application

---

## Useful Links

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Node Redis Documentation](https://github.com/redis/node-redis)

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the logs in `backend/logs/app.log`
3. Verify your environment variables
4. Test connections individually

Happy coding! 🚀
