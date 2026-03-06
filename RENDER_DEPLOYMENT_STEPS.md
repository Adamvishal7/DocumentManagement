# Quick Render Deployment Steps

## 🚀 Fast Track Deployment (5 minutes)

### Step 1: Install Git (if not installed)

Download from: https://git-scm.com/download/win

### Step 2: Push Code to GitHub

Open PowerShell in your project folder and run:

```powershell
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/document-management-system.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Render

1. **Sign up/Login to Render**
   - Go to: https://render.com
   - Sign in with: arockiaadam@gmail.com

2. **Deploy Backend**
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Settings:
     ```
     Name: docuflow-backend
     Root Directory: backend
     Environment: Node
     Build Command: npm install
     Start Command: npm start
     Instance Type: Free
     ```
   - Environment Variables:
     ```
     NODE_ENV = production
     PORT = 5000
     JWT_SECRET = your-super-secret-jwt-key-change-this-in-production
     CORS_ORIGIN = https://docuflow-frontend.onrender.com
     ```
   - Add Disk:
     ```
     Name: uploads
     Mount Path: /opt/render/project/src/backend/uploads
     Size: 1 GB
     ```
   - Click "Create Web Service"
   - **Copy the backend URL** (e.g., https://docuflow-backend.onrender.com)

3. **Deploy Frontend**
   - Click "New +" → "Static Site"
   - Connect same GitHub repository
   - Settings:
     ```
     Name: docuflow-frontend
     Root Directory: frontend
     Build Command: npm install && npm run build
     Publish Directory: build
     ```
   - Environment Variables:
     ```
     REACT_APP_API_URL = https://docuflow-backend.onrender.com/api
     ```
     (Use the backend URL from step 2)
   - Add Rewrite Rule:
     ```
     Source: /*
     Destination: /index.html
     ```
   - Click "Create Static Site"

4. **Update Backend CORS**
   - Go back to backend service
   - Update `CORS_ORIGIN` with your frontend URL
   - Save (will auto-redeploy)

### Step 4: Create Admin User

Once deployed, create an admin user using curl or Postman:

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

Or use the browser to visit your frontend and sign up!

## ✅ Done!

Your app is now live at:

- Frontend: https://docuflow-frontend.onrender.com
- Backend: https://docuflow-backend.onrender.com

## 📝 Important Notes

1. **Free Plan**: Services spin down after 15 min of inactivity
2. **First Load**: May take 30-60 seconds after spin-down
3. **Storage**: 1GB for uploads (upgrade for more)
4. **Database**: SQLite stored in persistent disk

## 🔧 Alternative: Use Render Blueprint (Easier!)

Instead of manual setup, you can use the `render.yaml` file:

1. Push code to GitHub (including render.yaml)
2. On Render, click "New +" → "Blueprint"
3. Select your repository
4. Click "Apply"
5. Done! Both services deploy automatically

## 🆘 Need Help?

If you encounter issues:

1. Check Render logs in dashboard
2. Verify environment variables
3. Test backend health: https://your-backend-url.onrender.com/health
4. Check GitHub repository is updated

---

**Ready to deploy? Let me know if you need help with any step!**
