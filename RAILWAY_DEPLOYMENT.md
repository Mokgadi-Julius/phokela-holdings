# Railway Deployment Guide - Phokela Guest House

This guide walks you through deploying the Phokela Guest House application to Railway.

## Prerequisites

1. Railway account (sign up at https://railway.app)
2. Railway CLI installed: `npm install -g @railway/cli`
3. GitHub account
4. Code pushed to GitHub repository

## Architecture

This application consists of two services:
- **Backend**: Node.js/Express API (Port 5000)
- **Frontend**: React/Vite SPA (Port 3000)
- **Database**: MySQL (Railway Plugin)

## Deployment Steps

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Login to Railway

```bash
railway login
```

### 3. Create a New Project

```bash
railway init
```

Select "Empty Project" and give it a name (e.g., "phokela-guest-house")

### 4. Add MySQL Database

In Railway Dashboard:
1. Click "New" → "Database" → "Add MySQL"
2. Railway will automatically create a MySQL instance
3. Note the connection details from the "Variables" tab

### 5. Deploy Backend Service

```bash
cd HotelBooking--Backend
railway up
```

Set the following environment variables in Railway Dashboard:

```
NODE_ENV=production
PORT=5000
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
JWT_SECRET=your-super-secret-jwt-key-change-this
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@phokelaholdings.co.za
ADMIN_EMAIL=admin@phokelaholdings.co.za
CORS_ORIGIN=https://your-frontend-url.railway.app
```

### 6. Deploy Frontend Service

Create a new service in the same project:

```bash
cd ../HotelBooking--React-Frontend
railway up
```

Set environment variables:

```
VITE_API_URL=https://your-backend-url.railway.app/api
```

### 7. Configure Custom Domains (Optional)

1. Go to Railway Dashboard
2. Click on each service
3. Go to "Settings" → "Domains"
4. Generate a Railway domain or add your custom domain

### 8. Database Setup

After first deployment, run database setup:

```bash
railway run npm run setup-db
```

Or connect via Railway's database connection and run the SQL migrations manually.

## Environment Variables Reference

### Backend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| NODE_ENV | Environment | production |
| PORT | Server port | 5000 |
| DB_HOST | MySQL host | Use Railway reference |
| DB_PORT | MySQL port | 3306 |
| DB_NAME | Database name | railway |
| DB_USER | Database user | root |
| DB_PASSWORD | Database password | Use Railway reference |
| JWT_SECRET | JWT signing key | Random string |
| CORS_ORIGIN | Frontend URL | https://your-app.railway.app |

### Frontend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | https://your-backend.railway.app/api |

## Using Railway Variable References

Railway allows you to reference variables from other services:

```
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
```

This automatically connects to your MySQL service.

## Troubleshooting

### Database Connection Issues

1. Check that MySQL service is running
2. Verify environment variables are set correctly
3. Check Railway logs: `railway logs`

### CORS Errors

Update `CORS_ORIGIN` in backend to match your frontend URL.

### Build Failures

1. Check Railway build logs
2. Ensure all dependencies are in package.json
3. Verify Node version compatibility

## Monitoring

- View logs: `railway logs`
- View metrics in Railway Dashboard
- Set up alerts for downtime

## Continuous Deployment

Railway automatically deploys when you push to your connected GitHub repository.

To connect:
1. Go to Railway Dashboard
2. Select your service
3. Click "Settings" → "Source"
4. Connect to GitHub repository

## Cost Estimation

Railway offers:
- $5/month free credit
- Usage-based pricing after that
- Approximately $5-20/month for small apps

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project Issues: Check repository issues

---

Deployed by Railway - https://railway.app
