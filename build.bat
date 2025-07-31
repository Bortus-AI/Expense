@echo off
echo 🚀 Starting build process for bunny.net deployment...

echo 📦 Installing dependencies...
call npm install

echo 📦 Installing backend dependencies...
cd backend
call npm install
cd ..

echo 📦 Installing frontend dependencies...
cd frontend
call npm install

echo 🔨 Building frontend...
call node .\node_modules\.bin\react-scripts build
cd ..

echo ✅ Build completed successfully!
echo 📁 Frontend build is ready in: frontend/build/ 