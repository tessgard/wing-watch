# 🚀 Wing Watch - Deployment Guide

## Prerequisites

1. **MongoDB Atlas Account**: https://www.mongodb.com/cloud/atlas
2. **Railway Account**: https://railway.app
3. **Vercel Account**: https://vercel.com

## Step 1: MongoDB Atlas Setup

1. **Create Cluster**:
   - Go to MongoDB Atlas and create a free M0 cluster
   - Choose your preferred region
   - Name your cluster (e.g., "wing-watch-cluster")

2. **Database Access**:
   - Create a database user with read/write permissions
   - Note down the username and password

3. **Network Access**:
   - Add `0.0.0.0/0` to allow access from anywhere (for now)
   - Later, you can restrict to specific IPs

4. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy the connection string, it looks like:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/wing-watch?retryWrites=true&w=majority
   ```

## Step 2: Deploy Backend to Railway

1. **Connect to Railway**:
   - Go to https://railway.app and sign up/login
   - Click "New Project" → "Deploy from GitHub repo"
   - Connect your GitHub account and select `tessgard/wing-watch`

2. **Configure Environment Variables**:
   - In Railway dashboard, go to your project
   - Click "Variables" and add:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wing-watch?retryWrites=true&w=majority
   NODE_ENV=production
   PORT=3001
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

3. **Deploy Settings**:
   - Railway will automatically detect the `railway.json` config
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Root directory: `/backend`

4. **Get Backend URL**:
   - After deployment, copy your Railway app URL (e.g., `https://wing-watch-production.up.railway.app`)

## Step 3: Deploy Frontend to Vercel

1. **Connect to Vercel**:
   - Go to https://vercel.com and sign up/login
   - Click "New Project" → "Import Git Repository"
   - Select your `tessgard/wing-watch` repository

2. **Configure Build Settings**:
   - Framework Preset: "Create React App"
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

3. **Environment Variables**:
   - In Vercel dashboard, go to "Settings" → "Environment Variables"
   - Add:
   ```
   REACT_APP_API_URL=https://your-railway-app.railway.app/api
   ```

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your frontend

## Step 4: Update Railway Frontend URL

1. Go back to Railway dashboard
2. Update the `FRONTEND_URL` environment variable with your Vercel URL
3. Redeploy the backend

## Step 5: Test Your Deployment

1. **Visit your Vercel URL**
2. **Test the application**:
   - Create a user account
   - Add some birds to your list
   - Check the leaderboard
   - Browse other users' lists

## Local Development with Production Database

1. **Create `.env` file** in `/backend`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wing-watch?retryWrites=true&w=majority
   NODE_ENV=development
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```

2. **Start development servers**:
   ```bash
   # Backend
   cd backend
   npm run dev
   
   # Frontend
   cd frontend
   npm start
   ```

## Troubleshooting

### Backend Issues
- Check Railway logs for MongoDB connection errors
- Verify environment variables are set correctly
- Ensure MongoDB Atlas allows connections from `0.0.0.0/0`

### Frontend Issues
- Check Vercel function logs
- Verify `REACT_APP_API_URL` points to correct Railway URL
- Test API endpoints directly in browser

### CORS Issues
- Ensure Railway `FRONTEND_URL` matches your Vercel domain
- Check that MongoDB Atlas network access allows your Railway server IP

## Estimated Costs

- **MongoDB Atlas**: Free (512MB)
- **Railway**: Free ($5 monthly credit)
- **Vercel**: Free (unlimited static sites)

**Total: FREE!** 🎉

## Next Steps

After deployment, consider:

1. **Custom Domain**: Add custom domain to Vercel
2. **Analytics**: Add user analytics with Vercel Analytics
3. **Monitoring**: Set up uptime monitoring for Railway
4. **Backup**: Set up MongoDB Atlas backups
5. **Security**: Restrict MongoDB network access to Railway IPs

---

Your Wing Watch app is now live and ready for bird watchers worldwide! 🐦✨