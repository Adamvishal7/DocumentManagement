# Deployment Guide - Render

This guide will help you deploy your Document Management System to Render.

## Prerequisites

1. GitHub account (to push your code)
2. Render account (sign up at https://render.com with your email: arockiaadam@gmail.com)

## Step 1: Install Git and Push to GitHub

### Install Git

Download and install Git from: https://git-scm.com/download/win

### Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit - Document Management System"
```

### Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository named "document-management-system"
3. Don't initialize with README (we already have one)

### Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/document-management-system.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Render

### Option A: Using render.yaml (Recommended)

1. Go to https://render.com and sign in with arockiaadam@gmail.com
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Click "Apply" to create both services

### Option B: Manual Setup

#### Deploy Backend:

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: docuflow-backend
   - **Root Directory**: backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `JWT_SECRET` = (generate a random string)
   - `CORS_ORIGIN` = (will be your frontend URL)

6. Add Persistent Disk:
   - **Name**: uploads
   - **Mount Path**: /opt/render/project/src/backend/uploads
   - **Size**: 1 GB

7. Click "Create Web Service"

#### Deploy Frontend:

1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: docuflow-frontend
   - **Root Directory**: frontend
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: build

4. Add Environment Variable:
   - `REACT_APP_API_URL` = (your backend URL from step 1)

5. Add Rewrite Rule:
   - **Source**: `/*`
   - **Destination**: `/index.html`

6. Click "Create Static Site"

## Step 3: Update CORS

After frontend is deployed:

1. Go to your backend service on Render
2. Update the `CORS_ORIGIN` environment variable with your frontend URL
3. Save changes (service will redeploy)

## Step 4: Create Test Users

After deployment, you need to create test users. You can:

1. Use the backend API directly:

```bash
curl -X POST https://your-backend-url.onrender.com/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@test.com",
    "password": "admin123",
    "role": "Admin"
  }'
```

2. Or add a script to create users on first deployment

## Important Notes

### Database

- SQLite database will be stored in the persistent disk
- Data persists across deployments
- Backup regularly using Render's disk snapshots

### File Uploads

- Files are stored in the persistent disk
- Maximum 1GB storage on free plan
- Upgrade plan for more storage

### Free Plan Limitations

- Backend service spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- 750 hours/month free (enough for one service)

### Upgrade Considerations

- For production use, consider paid plan ($7/month per service)
- Paid plans have:
  - No spin-down
  - More storage
  - Better performance
  - Custom domains

## Troubleshooting

### Backend won't start

- Check logs in Render dashboard
- Verify all environment variables are set
- Check that persistent disk is mounted

### Frontend can't connect to backend

- Verify CORS_ORIGIN is set correctly
- Check REACT_APP_API_URL in frontend
- Ensure backend is running (check health endpoint)

### Database errors

- Check persistent disk is mounted
- Verify write permissions
- Check disk space usage

## URLs After Deployment

- **Frontend**: https://docuflow-frontend.onrender.com
- **Backend**: https://docuflow-backend.onrender.com
- **Health Check**: https://docuflow-backend.onrender.com/health

## Alternative: Deploy with PostgreSQL

For better performance and reliability, consider using PostgreSQL instead of SQLite:

1. Create PostgreSQL database on Render
2. Update backend to use PostgreSQL
3. Migrate schema from SQLite to PostgreSQL

Would you like help with PostgreSQL migration?

## Support

If you encounter issues:

1. Check Render logs
2. Review environment variables
3. Test health endpoint
4. Check GitHub repository is up to date

---

**Ready to deploy?** Follow the steps above or let me know if you need help with any step!
