@echo off
REM Deployment script for bunny.net
REM This script will be run by bunny.net during deployment

echo Starting deployment...

REM Install dependencies
echo Installing dependencies...
call npm install

REM Build the frontend
echo Building frontend...
cd frontend
call npm install
call npm run build
cd ..

REM Create deployment structure
echo Preparing deployment files...
if not exist deployment mkdir deployment
xcopy /E /I backend deployment\
xcopy /E /I frontend\build deployment\public\
copy package.json deployment\

REM Create deployment server.js
echo Creating server.js...
(
echo const express = require^('express'^);
echo const path = require^('path'^);
echo const cors = require^('cors'^);
echo const helmet = require^('helmet'^);
echo const rateLimit = require^('express-rate-limit'^);
echo.
echo const app = express^(^);
echo const PORT = process.env.PORT ^|^| 3000;
echo.
echo // Middleware
echo app.use^(cors^(^)^);
echo app.use^(helmet^(^)^);
echo app.use^(express.json^({ limit: '10mb' }^)^);
echo app.use^(express.urlencoded^({ extended: true, limit: '10mb' }^)^);
echo.
echo // Rate limiting
echo const limiter = rateLimit^({
echo   windowMs: 15 * 60 * 1000, // 15 minutes
echo   max: 100 // limit each IP to 100 requests per windowMs
echo }^);
echo app.use^(limiter^);
echo.
echo // Serve static files from React build
echo app.use^(express.static^(path.join^(__dirname, 'public'^)^)^);
echo.
echo // API routes
echo app.use^('/api/auth', require^('./routes/auth'^)^);
echo app.use^('/api/transactions', require^('./routes/transactions'^)^);
echo app.use^('/api/receipts', require^('./routes/receipts'^)^);
echo app.use^('/api/matches', require^('./routes/matches'^)^);
echo app.use^('/api/analytics', require^('./routes/analytics'^)^);
echo app.use^('/api/exports', require^('./routes/exports'^)^);
echo app.use^('/api/settings', require^('./routes/settings'^)^);
echo app.use^('/api/companies', require^('./routes/companies'^)^);
echo app.use^('/api/masterdata', require^('./routes/masterdata'^)^);
echo app.use^('/api/ai', require^('./routes/ai'^)^);
echo.
echo // Handle React routing, return all requests to React app
echo app.get^('*', ^(req, res^) =^> {
echo   res.sendFile^(path.join^(__dirname, 'public', 'index.html'^)^);
echo }^);
echo.
echo app.listen^(PORT, ^(^) =^> {
echo   console.log^(`Server is running on port ${PORT}`^);
echo }^);
) > deployment\server.js

REM Create deployment package.json
echo Creating package.json...
(
echo {
echo   "name": "expense-matcher-deployment",
echo   "version": "1.0.0",
echo   "main": "server.js",
echo   "scripts": {
echo     "start": "node server.js"
echo   },
echo   "dependencies": {
echo     "archiver": "^7.0.1",
echo     "axios": "^1.11.0",
echo     "bcryptjs": "^3.0.2",
echo     "cors": "^2.8.5",
echo     "csv-parser": "^3.0.0",
echo     "dotenv": "^17.2.1",
echo     "exceljs": "^4.4.0",
echo     "express": "^4.18.2",
echo     "express-rate-limit": "^8.0.1",
echo     "helmet": "^8.1.0",
echo     "jsonwebtoken": "^9.0.2",
echo     "moment": "^2.30.1",
echo     "multer": "^1.4.5-lts.1",
echo     "pdf-lib": "^1.17.1",
echo     "pdf-parse": "^1.1.1",
echo     "pdf-poppler": "^0.2.1",
echo     "pdfkit": "^0.17.1",
echo     "sqlite3": "^5.1.6",
echo     "tesseract.js": "^5.0.4",
echo     "uuid": "^9.0.1"
echo   }
echo }
) > deployment\package.json

REM Install deployment dependencies
echo Installing deployment dependencies...
cd deployment
call npm install --production
cd ..

echo Deployment preparation complete!
echo The deployment directory is ready for bunny.net 