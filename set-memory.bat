@echo off
echo Setting Node.js memory allocation to 8GB...
set NODE_OPTIONS=--max-old-space-size=8192
echo NODE_OPTIONS set to: %NODE_OPTIONS%
echo.
echo Memory allocation configured successfully!
echo You can now run your npm commands with increased memory.
echo.
echo Running npm run build with 8GB memory...
npm run build
