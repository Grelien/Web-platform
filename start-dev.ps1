# PowerShell script to run both frontend and backend
Write-Host "Starting Agricultural IoT Platform..." -ForegroundColor Green

# Start backend in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev --prefix backend" -WindowStyle Normal

# Start frontend in another new PowerShell window  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev --prefix frontend" -WindowStyle Normal

Write-Host "Both services started in separate windows!" -ForegroundColor Green
Write-Host "Backend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
