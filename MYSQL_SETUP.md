# MySQL Docker Setup Guide

## ✅ What's Been Configured

Your application is now configured to use **MySQL in a Docker container**. Here's what's ready:

### Files Created/Modified:
1. ✅ `docker-compose.yml` - MySQL container configuration
2. ✅ `HotelBooking--Backend/src/config/database-mysql.js` - MySQL Sequelize config
3. ✅ `HotelBooking--Backend/.env` - MySQL credentials
4. ✅ `HotelBooking--Backend/src/server.js` - Updated to use MySQL
5. ✅ `HotelBooking--Backend/src/scripts/seed-mysql.js` - MySQL seed script
6. ✅ `mysql2` package installed

## 🚀 How to Start

### Step 1: Start Docker Desktop
**You must start Docker Desktop first!**

1. Open Docker Desktop application
2. Wait for it to fully start (Docker icon in system tray will be green)

### Step 2: Start MySQL Container
```bash
# Navigate to project root
cd C:\Users\hp\Pictures\replication\replication\phokela_holdings

# Start MySQL container
docker-compose up -d

# Verify it's running
docker ps
```

You should see:
```
CONTAINER ID   IMAGE        COMMAND                  CREATED         STATUS         PORTS                    NAMES
xxxxx          mysql:8.0    "docker-entrypoint.s…"   X seconds ago   Up X seconds   0.0.0.0:3306->3306/tcp   phokela_mysql
```

### Step 3: Seed the Database
```bash
# Navigate to backend
cd HotelBooking--Backend

# Run seed script
node src/scripts/seed-mysql.js
```

You should see:
```
✅ MySQL Database Connected Successfully
📁 Database: phokela_guest_house
🔗 Host: localhost:3306
✅ Database models synchronized
🌱 Seeding MySQL database...
✅ Successfully seeded 5 services!

📊 Services created:
   - Comfort Room (accommodation) - R850 per night
   - Executive Suite (accommodation) - R1250 per night
   - Conference Package (conference) - R2500 per day
   - Event Hosting Package (events) - R15000 per event
   - Catering Services (catering) - R350 per person
```

### Step 4: Start the Backend
```bash
# Make sure you're in HotelBooking--Backend
cd HotelBooking--Backend

# Start the server
npm run dev
```

You should see:
```
✅ MySQL Database Connected Successfully
📁 Database: phokela_guest_house
🔗 Host: localhost:3306
✅ Database models synchronized
🚀 Phokela Guest House API Server running on port 5000
```

### Step 5: Test the API
```bash
# Test services endpoint
curl http://localhost:5000/api/services

# Test admin dashboard
curl http://localhost:5000/api/admin/dashboard

# Test bookings stats
curl http://localhost:5000/api/bookings/stats
```

## 📋 MySQL Credentials

**Database:** `phokela_guest_house`
**User:** `phokela_user`
**Password:** `phokela_pass_2025`
**Root Password:** `phokela_root_2025`
**Port:** `3306`

## 🛠️ Useful Docker Commands

```bash
# View logs
docker-compose logs -f mysql

# Stop MySQL container
docker-compose stop

# Start MySQL container
docker-compose start

# Restart MySQL container
docker-compose restart

# Stop and remove container (data persists)
docker-compose down

# Stop and remove container AND data
docker-compose down -v

# Connect to MySQL CLI
docker exec -it phokela_mysql mysql -u phokela_user -pphokela_pass_2025 phokela_guest_house

# Check container status
docker ps
```

## 🔧 Troubleshooting

### "Cannot connect to MySQL"
1. Make sure Docker Desktop is running
2. Check container is running: `docker ps`
3. If not, start it: `docker-compose up -d`

### "Port 3306 already in use"
Another MySQL is running on your system:
```bash
# Windows: Find what's using port 3306
netstat -ano | findstr :3306

# Kill that process or change port in docker-compose.yml
```

### "Access denied for user"
Check `.env` file has correct credentials matching docker-compose.yml

### Reset Everything
```bash
# Stop and remove everything
docker-compose down -v

# Start fresh
docker-compose up -d

# Re-seed
node src/scripts/seed-mysql.js
```

## 🌐 Production Deployment

This same setup works for production! Just:
1. Change passwords in `.env` and `docker-compose.yml`
2. Update `DB_HOST` to your production MySQL server
3. Or use managed MySQL (AWS RDS, Google Cloud SQL, etc.)

## 📦 What's Different from SQLite?

The beauty of Sequelize is that **the same models and routes work for both!**

Only these files changed:
- `src/config/database-mysql.js` (new)
- `src/server.js` (one line - database import)
- `.env` (MySQL credentials)

Everything else is identical!
