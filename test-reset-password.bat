@echo off
echo Testing password reset for abushan.isro@gmail.com...
curl -X POST http://localhost:4000/api/v1/auth/reset-password -H "Content-Type: application/json" -d "{\"email\":\"abushan.isro@gmail.com\"}"
echo.
echo Check your email for reset link!
pause
