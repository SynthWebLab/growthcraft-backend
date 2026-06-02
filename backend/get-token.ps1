# Quick script to get admin token
Write-Host ""
Write-Host "Getting Admin/Ops Token..." -ForegroundColor Cyan
Write-Host ""

# Try ops credentials (admin role is deprecated)
$credentials = @(
    @{ email = "ops@growthcraft.com"; password = "Ops@123456"; name = "OPS" }
)

$success = $false

foreach ($cred in $credentials) {
    try {
        Write-Host "Trying $($cred.name) user ($($cred.email))..." -ForegroundColor Gray
        
        $loginBody = @{
            email = $cred.email
            password = $cred.password
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "http://localhost:5002/api/v1/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $loginBody `
            -ErrorAction Stop

        $token = $response.data.accessToken
        $user = $response.data.user

        Write-Host ""
        Write-Host "Login successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "User: $($user.fullName)" -ForegroundColor Yellow
        Write-Host "Email: $($user.email)" -ForegroundColor Yellow
        Write-Host "Role: $($user.role)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Access Token (copy this):" -ForegroundColor Cyan
        Write-Host ""
        Write-Host $token -ForegroundColor White
        Write-Host ""
        Write-Host "Use in Postman/HTTP Client:" -ForegroundColor Cyan
        Write-Host "Authorization: Bearer $token" -ForegroundColor Gray
        Write-Host ""

        # Save to file for easy copy
        $token | Out-File -FilePath "token.txt" -NoNewline
        Write-Host "Token saved to token.txt" -ForegroundColor Green
        Write-Host ""
        
        $success = $true
        break

    } catch {
        Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

if (-not $success) {
    Write-Host "All login attempts failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check if server is running: npm run dev" -ForegroundColor Yellow
    Write-Host ""
}
