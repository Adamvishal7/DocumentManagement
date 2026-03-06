# Quick Fix for Vercel Deployment

## Problem

Your frontend on Vercel is trying to connect to localhost:5000 which doesn't exist in production.

## Solution: Deploy Backend to Render (5 minutes)

### Step 1: Deploy Backend to Render

1. Go to: https://dashboard.render.com
2. Sign in with: arockiaadam@gmail.com
3. Click "New +" → "Web Service"
4. Connect GitHub: Adamvishal7/DocumentManagement
5. Configure:

   ```
   Name: docuflow-backend
   Root Directory: backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```

6. Add Environment Variables:

   ```
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key-12345
   CORS_ORIGIN=https://document-management-three.vercel.app
   ```

7. Add Persistent Disk:

   ```
   Name: uploads
   Mount Path: /opt/render/project/src/backend/uploads
   Size: 1 GB
   ```

8. Click "Create Web Service"
9. Wait 3-5 minutes for deployment
10. Copy your backend URL (e.g., https://docuflow-backend.onrender.com)

### Step 2: Update Vercel Frontend

1. Go to: https://vercel.com/arockiaadam-2121s-projects/document-management/settings/environment-variables
2. Add new environment variable:

   ```
   Key: REACT_APP_API_URL
   Value: https://your-backend-url.onrender.com/api
   ```

   (Replace with your actual Render backend URL)

3. Go to Deployments tab
4. Click "Redeploy" on the latest deployment

### Step 3: Create Admin User

After backend is deployed, run this command:

```powershell
Invoke-WebRequest -Uri "https://your-backend-url.onrender.com/api/users" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"name":"Admin User","email":"admin@test.com","password":"admin123","role":"Admin"}'
```

Replace `your-backend-url` with your actual Render URL.

### Step 4: Test

Visit: https://document-management-three.vercel.app

Login with:

- Email: admin@test.com
- Password: admin123

## Done! 🎉

Your app should now work properly with:

- Frontend on Vercel (fast CDN)
- Backend on Render (persistent storage)
