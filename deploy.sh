#!/bin/bash

echo "🚀 CRUD App Deployment Script"
echo "=============================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: CRUD app with database"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

echo ""
echo "🌍 Deployment Options:"
echo "1. Deploy to Render.com (FREE - Recommended)"
echo "2. Deploy to Railway.app (FREE)"
echo "3. Build Docker image"
echo "4. Manual deployment instructions"
echo ""

read -p "Choose deployment option (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Deploying to Render.com..."
        echo "1. Go to https://render.com"
        echo "2. Sign up with GitHub"
        echo "3. Click 'New +' → 'Web Service'"
        echo "4. Connect your GitHub repository"
        echo "5. Configure:"
        echo "   - Name: crud-app"
        echo "   - Environment: Node"
        echo "   - Build Command: npm install"
        echo "   - Start Command: npm start"
        echo "   - Plan: Free"
        echo "6. Click 'Create Web Service'"
        echo ""
        echo "✅ Your app will be available at: https://your-app-name.onrender.com"
        ;;
    2)
        echo ""
        echo "🚂 Deploying to Railway.app..."
        echo "1. Go to https://railway.app"
        echo "2. Sign up with GitHub"
        echo "3. Click 'New Project' → 'Deploy from GitHub repo'"
        echo "4. Select your repository"
        echo "5. Railway will auto-deploy your app"
        echo ""
        echo "✅ Your app will be available at Railway's domain"
        ;;
    3)
        echo ""
        echo "🐳 Building Docker image..."
        if command -v docker &> /dev/null; then
            docker build -t crud-app .
            echo "✅ Docker image built successfully!"
            echo ""
            echo "To run locally:"
            echo "docker run -p 3000:3000 crud-app"
            echo ""
            echo "To save image for other computers:"
            echo "docker save crud-app > crud-app.tar"
        else
            echo "❌ Docker not installed. Please install Docker first."
        fi
        ;;
    4)
        echo ""
        echo "🔧 Manual Deployment Instructions:"
        echo "1. Push to GitHub:"
        echo "   git remote add origin YOUR_GITHUB_REPO_URL"
        echo "   git push -u origin main"
        echo ""
        echo "2. On any computer with Node.js:"
        echo "   git clone YOUR_REPO_URL"
        echo "   cd crud"
        echo "   npm install"
        echo "   npm start"
        echo ""
        echo "3. For production servers, use PM2:"
        echo "   npm install -g pm2"
        echo "   pm2 start index.js --name 'crud-app'"
        ;;
    *)
        echo "❌ Invalid option. Please choose 1-4."
        ;;
esac

echo ""
echo "📚 For detailed instructions, see DEPLOYMENT.md"
echo "🌐 Your app will be accessible from any computer with internet!"
