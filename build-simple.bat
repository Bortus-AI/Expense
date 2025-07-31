@echo off
echo Building frontend for bunny.net deployment...

cd frontend
echo Installing frontend dependencies...
call npm install

echo Building React app...
call node .\node_modules\.bin\react-scripts build

echo Frontend build completed!
cd .. 