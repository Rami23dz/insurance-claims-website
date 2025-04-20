# Insurance Claims Processing Website - Vercel Deployment Guide

This guide provides instructions for deploying both the frontend and backend of the insurance claims processing website to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. A [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas/register) (free tier available)
3. [Node.js](https://nodejs.org/) installed on your local machine
4. [Vercel CLI](https://vercel.com/docs/cli) installed: `npm i -g vercel`

## Step 1: Set up MongoDB Atlas Database

1. Create a free cluster in MongoDB Atlas
2. Set up a database user with password
3. Whitelist all IP addresses (0.0.0.0/0) for development
4. Get your connection string (will look like: `mongodb+srv://username:password@cluster.mongodb.net/database`)

## Step 2: Prepare Your Project for Vercel

The project already includes a `vercel.json` configuration file in the root directory that tells Vercel how to deploy the backend API.

```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "backend/server.js"
    }
  ]
}
```

## Step 3: Deploy to Vercel

1. Login to Vercel from the command line:
   ```
   vercel login
   ```

2. Navigate to your project root directory and deploy:
   ```
   cd insurance-claims-website
   vercel
   ```

3. Follow the prompts:
   - Set up and deploy: `Y`
   - Link to existing project: `N`
   - Project name: `insurance-claims-website` (or your preferred name)
   - Directory: `.` (current directory)
   - Override settings: `N`

4. Set up environment variables in the Vercel dashboard:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure secret for JWT authentication
   - `NODE_ENV`: `production`

## Step 4: Update Frontend Configuration

1. After deployment, Vercel will provide you with a URL for your API (e.g., `https://insurance-claims-website.vercel.app`)

2. Update the `next.config.js` file in the frontend directory:
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     reactStrictMode: true,
     output: 'export',
     distDir: 'out',
     images: {
       unoptimized: true,
     },
     env: {
       API_URL: 'https://your-vercel-deployment-url.vercel.app/api'
     }
   }

   module.exports = nextConfig
   ```

3. Deploy the frontend separately (optional):
   ```
   cd frontend
   vercel
   ```

## Step 5: Test Your Deployment

1. Visit your deployed API at `https://your-vercel-deployment-url.vercel.app/api`
2. Test authentication by logging in with the admin credentials:
   - Email: `admin@example.com`
   - Password: `admin123`
3. Test document upload and processing functionality

## Advantages of Vercel Deployment

- **Free Tier**: Generous free tier with no credit card required
- **Serverless Functions**: Optimized API performance
- **Automatic HTTPS**: Secure by default
- **Easy Updates**: Connect to GitHub for automatic deployments
- **Unified Platform**: Manage both frontend and backend in one place

## Troubleshooting

- **Connection Issues**: Ensure your MongoDB Atlas connection string is correct and the IP whitelist includes `0.0.0.0/0`
- **Deployment Failures**: Check Vercel logs for detailed error messages
- **API Not Found**: Verify your `vercel.json` configuration is correct
- **CORS Errors**: Ensure your backend CORS configuration allows your frontend domain

For more help, refer to the [Vercel documentation](https://vercel.com/docs) or [MongoDB Atlas documentation](https://docs.atlas.mongodb.com/).
