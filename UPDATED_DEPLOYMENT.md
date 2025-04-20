# Insurance Claims Processing Website - Updated Deployment Guide

## Overview
This guide provides updated instructions for deploying the insurance claims processing website using your MongoDB Atlas credentials.

## MongoDB Atlas Configuration
Your MongoDB Atlas database has been configured with:
- Connection String: mongodb://atlas-sql-6805459bb110aa01ccd75b24-mz9tc.a.query.mongodb.net/sample_mflix?ssl=true&authSource=admin
- Username: firas
- Password: firas.com1

## Deployment Steps

### Option 1: Deploy to Vercel (Recommended)
1. Create a Vercel account at https://vercel.com/signup
2. Install Vercel CLI: `npm i -g vercel`
3. Navigate to your project directory: `cd insurance-claims-website`
4. Deploy to Vercel: `vercel`
5. Follow the prompts to complete deployment
6. When asked about environment variables, use the ones from `.env.production`

### Option 2: Deploy to Heroku
1. Create a Heroku account at https://signup.heroku.com
2. Install Heroku CLI: `npm install -g heroku`
3. Login to Heroku: `heroku login`
4. Create a new Heroku app: `heroku create insurance-claims-app`
5. Set environment variables:
   ```
   heroku config:set MONGO_URI=mongodb://atlas-sql-6805459bb110aa01ccd75b24-mz9tc.a.query.mongodb.net/sample_mflix?ssl=true&authSource=admin
   heroku config:set MONGO_USER=firas
   heroku config:set MONGO_PASSWORD=firas.com1
   heroku config:set JWT_SECRET=insurance-claims-secure-jwt-secret-key-2025
   heroku config:set NODE_ENV=production
   ```
6. Deploy to Heroku: `git push heroku main`

## Testing Your Deployment
1. Access your deployed application
2. Login with the default admin credentials:
   - Email: admin@example.com
   - Password: admin123
3. Upload a test document to verify functionality

## Fallback Mechanism
The application includes a fallback to an in-memory database if the MongoDB Atlas connection fails. This ensures your application remains functional even during temporary database connection issues.

## Security Considerations
- The MongoDB credentials are stored in environment variables for security
- The application uses HTTPS by default when deployed to Vercel or Heroku
- JWT authentication is implemented for secure user sessions

## Support
If you encounter any issues during deployment, refer to:
- Vercel documentation: https://vercel.com/docs
- MongoDB Atlas documentation: https://docs.atlas.mongodb.com/
- The VERCEL_DEPLOYMENT.md file for detailed Vercel-specific instructions
