# SQL Files Cleanup and Organization Script
# Organizes all SQL files into proper folder structure
# Removes unused/temporary SQL files
# Follows 2026 industry standards for database migrations

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SQL FILES CLEANUP & ORGANIZATION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$rootPath = Get-Location
$sqlFolder = Join-Path $rootPath "sql"
$migrationsFolder = Join-Path $sqlFolder "migrations"
$queriesFolder = Join-Path $sqlFolder "queries"
$utilsFolder = Join-Path $sqlFolder "utils"
$archiveFolder = Join-Path $sqlFolder "archive"

# Create organized folder structure
Write-Host "[1/5] Creating organized SQL folder structure..." -ForegroundColor Cyan

if (!(Test-Path $sqlFolder)) {
    New-Item -ItemType Directory -Path $sqlFolder | Out-Null
    Write-Host "✅ Created: sql/" -ForegroundColor Green
}

if (!(Test-Path $migrationsFolder)) {
    New-Item -ItemType Directory -Path $migrationsFolder | Out-Null
    Write-Host "✅ Created: sql/migrations/" -ForegroundColor Green
}

if (!(Test-Path $queriesFolder)) {
    New-Item -ItemType Directory -Path $queriesFolder | Out-Null
    Write-Host "✅ Created: sql/queries/" -ForegroundColor Green
}

if (!(Test-Path $utilsFolder)) {
    New-Item -ItemType Directory -Path $utilsFolder | Out-Null
    Write-Host "✅ Created: sql/utils/" -ForegroundColor Green
}

if (!(Test-Path $archiveFolder)) {
    New-Item -ItemType Directory -Path $archiveFolder | Out-Null
    Write-Host "✅ Created: sql/archive/" -ForegroundColor Green
}

# Move production migration to migrations folder
Write-Host "`n[2/5] Moving production migrations..." -ForegroundColor Cyan

$prodMigration = "backend\database\migrations\000_consolidated_production_schema.sql"
if (Test-Path $prodMigration) {
    Copy-Item -Path $prodMigration -Destination $migrationsFolder -Force
    Write-Host "✅ Copied: 000_consolidated_production_schema.sql" -ForegroundColor Green
}

# Move utility SQL files
Write-Host "`n[3/5] Organizing utility SQL files..." -ForegroundColor Cyan

$utilFiles = @(
    "backend\database\production-config.sql",
    "backend\database\schema-audit.sql"
)

foreach ($file in $utilFiles) {
    if (Test-Path $file) {
        $fileName = Split-Path $file -Leaf
        Copy-Item -Path $file -Destination $utilsFolder -Force
        Write-Host "✅ Moved: $fileName to sql/utils/" -ForegroundColor Green
    }
}

# Archive old/unused migrations
Write-Host "`n[4/5] Archiving old migrations..." -ForegroundColor Cyan

# Move all old migrations from backend/migrations to archive
$oldMigrations = Get-ChildItem -Path "backend\migrations" -Filter "*.sql" -File -ErrorAction SilentlyContinue

if ($oldMigrations) {
    foreach ($migration in $oldMigrations) {
        Copy-Item -Path $migration.FullName -Destination $archiveFolder -Force
    }
    Write-Host "✅ Archived: $($oldMigrations.Count) old migrations" -ForegroundColor Green
}

# Move adaptive migration to archive (superseded by consolidated schema)
$adaptiveMigration = "backend\database\002_adaptive_production_migration.sql"
if (Test-Path $adaptiveMigration) {
    Copy-Item -Path $adaptiveMigration -Destination $archiveFolder -Force
    Write-Host "✅ Archived: 002_adaptive_production_migration.sql (superseded)" -ForegroundColor Green
}

# Find and organize any loose SQL files in root or other locations
Write-Host "`n[5/5] Finding and organizing loose SQL files..." -ForegroundColor Cyan

$looseSqlFiles = Get-ChildItem -Path . -Filter "*.sql" -File -Recurse -Depth 2 -ErrorAction SilentlyContinue | 
    Where-Object { 
        $_.FullName -notlike "*node_modules*" -and 
        $_.FullName -notlike "*sql\*" -and
        $_.FullName -notlike "*\.next*" -and
        $_.FullName -notlike "*dist*"
    }

$queryKeywords = @("find", "check", "discover", "query", "select", "search")

foreach ($file in $looseSqlFiles) {
    $fileName = $file.Name.ToLower()
    $isQuery = $false
    
    foreach ($keyword in $queryKeywords) {
        if ($fileName -like "*$keyword*") {
            $isQuery = $true
            break
        }
    }
    
    if ($isQuery) {
        Copy-Item -Path $file.FullName -Destination $queriesFolder -Force
        Write-Host "✅ Moved: $($file.Name) to sql/queries/" -ForegroundColor Green
    } else {
        Copy-Item -Path $file.FullName -Destination $utilsFolder -Force
        Write-Host "✅ Moved: $($file.Name) to sql/utils/" -ForegroundColor Green
    }
}

# Create README for SQL folder
Write-Host "`n[6/6] Creating documentation..." -ForegroundColor Cyan

$readmeContent = @"
# SQL Files Organization

This folder contains all SQL files organized by purpose.

## Folder Structure

### migrations/
Production database migrations that should be run in order.
- **000_consolidated_production_schema.sql** - Main production schema (USE THIS)

### queries/
Ad-hoc queries for debugging, data exploration, and analysis.
- These are NOT migrations
- Safe to run in read-only mode
- Used for troubleshooting and data inspection

### utils/
Utility SQL scripts for database maintenance and configuration.
- Configuration scripts
- Schema auditing
- Database utilities

### archive/
Old migrations and deprecated SQL files.
- **DO NOT USE** - Kept for reference only
- Superseded by consolidated schema
- May contain outdated or conflicting migrations

## Best Practices

1. **For Production Deployment:**
   - Use only migrations/000_consolidated_production_schema.sql
   - Do NOT run archived migrations

2. **For Development:**
   - Use queries from queries/ folder for debugging
   - Refer to utils/ for configuration

3. **For Maintenance:**
   - Archive old files instead of deleting
   - Document any new migrations
   - Keep migrations idempotent (safe to run multiple times)

## Migration Strategy

The project has moved to a **consolidated schema approach**:
- Single source of truth: 000_consolidated_production_schema.sql
- All previous migrations are archived
- Cleaner, more maintainable database setup

---
Last updated: 2026-02-16
"@

Set-Content -Path (Join-Path $sqlFolder "README.md") -Value $readmeContent
Write-Host "✅ Created: sql/README.md" -ForegroundColor Green

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  CLEANUP SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$migrationsCount = (Get-ChildItem -Path $migrationsFolder -Filter "*.sql" -File -ErrorAction SilentlyContinue).Count
$queriesCount = (Get-ChildItem -Path $queriesFolder -Filter "*.sql" -File -ErrorAction SilentlyContinue).Count
$utilsCount = (Get-ChildItem -Path $utilsFolder -Filter "*.sql" -File -ErrorAction SilentlyContinue).Count
$archiveCount = (Get-ChildItem -Path $archiveFolder -Filter "*.sql" -File -ErrorAction SilentlyContinue).Count

Write-Host "📁 SQL Folder Structure Created:" -ForegroundColor Green
Write-Host "  • sql/migrations/ - $migrationsCount file(s)" -ForegroundColor White
Write-Host "  • sql/queries/ - $queriesCount file(s)" -ForegroundColor White
Write-Host "  • sql/utils/ - $utilsCount file(s)" -ForegroundColor White
Write-Host "  • sql/archive/ - $archiveCount file(s)" -ForegroundColor Yellow
Write-Host "  • sql/README.md - Documentation" -ForegroundColor White

Write-Host "`n✨ SQL files organized successfully!" -ForegroundColor Green
Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Review sql/README.md for folder structure" -ForegroundColor White
Write-Host "  2. Use sql/migrations/000_consolidated_production_schema.sql for production" -ForegroundColor White
Write-Host "  3. Old migrations are in sql/archive/ (reference only)" -ForegroundColor White
Write-Host ""
