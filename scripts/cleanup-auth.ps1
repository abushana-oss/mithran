# Auth Cleanup Script - Remove Outdated Auth Files
# Following 2026 Industry Standards
# Run this script from the project root directory

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AUTH CLEANUP - 2026 Standards" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$filesRemoved = 0
$foldersRemoved = 0
$errors = @()

# Function to safely remove file
function Remove-SafeFile {
    param($path, $description)
    
    if (Test-Path $path) {
        try {
            Remove-Item -Path $path -Force -ErrorAction Stop
            Write-Host "✅ Removed: $description" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "❌ Failed: $description - $($_.Exception.Message)" -ForegroundColor Red
            $script:errors += "Failed to remove $path"
            return $false
        }
    } else {
        Write-Host "⏭️  Skipped: $description (not found)" -ForegroundColor Yellow
        return $false
    }
}

# Function to safely remove folder
function Remove-SafeFolder {
    param($path, $description)
    
    if (Test-Path $path) {
        try {
            Remove-Item -Path $path -Recurse -Force -ErrorAction Stop
            Write-Host "✅ Removed: $description" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "❌ Failed: $description - $($_.Exception.Message)" -ForegroundColor Red
            $script:errors += "Failed to remove $path"
            return $false
        }
    } else {
        Write-Host "⏭️  Skipped: $description (not found)" -ForegroundColor Yellow
        return $false
    }
}

Write-Host "Starting auth cleanup...`n" -ForegroundColor White

# 1. Remove Backend Auth Module
Write-Host "`n[1/7] Backend Auth Module" -ForegroundColor Cyan
if (Remove-SafeFolder ".\backend\src\modules\auth" "Backend auth module (deprecated)") {
    $foldersRemoved++
}

# 2. Remove Auth Coordinator
Write-Host "`n[2/7] Auth Coordinator" -ForegroundColor Cyan
if (Remove-SafeFile ".\lib\api\auth-coordinator.ts" "Auth coordinator (over-engineered)") {
    $filesRemoved++
}

# 3. Remove Auth Interceptors
Write-Host "`n[3/7] Auth Interceptors" -ForegroundColor Cyan
if (Remove-SafeFile ".\lib\api\auth-interceptor.ts" "Auth interceptor") {
    $filesRemoved++
}
if (Remove-SafeFile ".\lib\api\auth-request-interceptor.ts" "Auth request interceptor") {
    $filesRemoved++
}
if (Remove-SafeFile ".\lib\api\auth-aware-query.ts" "Auth aware query") {
    $filesRemoved++
}

# 4. Remove Auth Sync Components
Write-Host "`n[4/7] Auth Sync Components" -ForegroundColor Cyan
if (Remove-SafeFile ".\lib\components\CorrelationAuthSync.tsx" "Correlation auth sync") {
    $filesRemoved++
}
if (Remove-SafeFile ".\lib\providers\auth-query-sync.tsx" "Auth query sync") {
    $filesRemoved++
}
if (Remove-SafeFile ".\lib\components\auth-ready-wrapper.tsx" "Auth ready wrapper") {
    $filesRemoved++
}

# 5. Remove Auth Config
Write-Host "`n[5/7] Auth Config" -ForegroundColor Cyan
if (Remove-SafeFile ".\lib\config\auth.config.ts" "Auth config (duplicate)") {
    $filesRemoved++
}

# 6. Remove Environment Files (Security Risk)
Write-Host "`n[6/7] Environment Files (Security)" -ForegroundColor Cyan
if (Remove-SafeFile ".\backend\.env.development.local" "Backend .env.development.local (security risk)") {
    $filesRemoved++
}
if (Remove-SafeFile ".\.env.development.local" "Root .env.development.local (security risk)") {
    $filesRemoved++
}
if (Remove-SafeFile ".\.env.local" "Root .env.local (security risk)") {
    $filesRemoved++
}

# 7. Check for any other auth-related legacy files
Write-Host "`n[7/7] Checking for other legacy auth files..." -ForegroundColor Cyan

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  CLEANUP SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Files removed: $filesRemoved" -ForegroundColor Green
Write-Host "Folders removed: $foldersRemoved" -ForegroundColor Green

if ($errors.Count -gt 0) {
    Write-Host "`nErrors encountered:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
} else {
    Write-Host "`n✨ Cleanup completed successfully!" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  NEXT STEPS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "1. Check for import errors:" -ForegroundColor Yellow
Write-Host "   npm run type-check" -ForegroundColor White
Write-Host "`n2. Test authentication flow:" -ForegroundColor Yellow
Write-Host "   - Sign in with email/password" -ForegroundColor White
Write-Host "   - Sign in with Google OAuth" -ForegroundColor White
Write-Host "   - Sign out" -ForegroundColor White
Write-Host "`n3. Review AUTH_CLEANUP_PLAN.md for details" -ForegroundColor Yellow
Write-Host ""
