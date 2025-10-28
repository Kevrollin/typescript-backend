#!/bin/bash

# FundHub TypeScript Backend Deployment Script
echo "🚀 Starting FundHub TypeScript Backend Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the typescript-backend directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "🎉 Deployment complete!"
echo "📝 Don't forget to:"
echo "   1. Set your DATABASE_URL environment variable in Vercel"
echo "   2. Set your SECRET_KEY environment variable in Vercel"
echo "   3. Configure any other required environment variables"
