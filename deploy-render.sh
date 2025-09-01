#!/bin/bash

echo "🚀 Deploying to Render.com..."
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No remote origin found. Please add your GitHub repository:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/crud-app.git"
    exit 1
fi

echo "✅ Git repository ready"
echo ""

# Push to GitHub
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Deploy to Render.com - $(date)"
git push origin main

echo ""
echo "✅ Code pushed to GitHub!"
echo ""
echo "🌐 Now deploy to Render.com:"
echo ""
echo "1. Go to https://render.com"
echo "2. Sign up/Login with GitHub"
echo "3. Click 'New +' → 'Web Service'"
echo "4. Connect your GitHub repository"
echo "5. Configure:"
echo "   - Name: crud-app"
echo "   - Environment: Node"
echo "   - Build Command: npm install"
echo "   - Start Command: npm start"
echo "   - Health Check Path: /api/health"
echo ""
echo "6. Click 'Create Web Service'"
echo ""
echo "🎉 Your app will be live at: https://your-app-name.onrender.com"
echo ""
echo "📝 Demo accounts:"
echo "   - Admin: admin / password123"
echo "   - User: user / user123"
echo "   - Demo: demo / demo123"
