<#
.SYNOPSIS
  Restore a full backup created by backup-full.ps1.
.DESCRIPTION
  Extracts a .tar.gz backup and restores:
    - MongoDB (via mongorestore)
    - Uploads directory
    - MeiliSearch indexes (via curl POST)
  Config files (*.yaml, .env) are NOT auto-restored; they are extracted
  to the restore directory for manual review.
.PARAMETER ArchivePath
  Path to the .tar.gz backup archive.
.PARAMETER MongoUri
  Target MongoDB URI. Falls back to MONGO_URI env var.
.PARAMETER UploadsDir
  Target uploads directory. Default: ./uploads
.PARAMETER MeiliUrl
  Target MeiliSearch URL. Falls back to MEILI_HOST env var.
.PARAMETER MeiliMasterKey
  Target MeiliSearch master key. Falls back to MEILI_MASTER_KEY env var.
.PARAMETER DryRun
  If set, only list what would be restored without making changes.
#>

param(
  [Parameter(Mandatory = $true)]
  [string]$ArchivePath,
  [string]$MongoUri = $env:MONGO_URI,
  [string]$UploadsDir = ".\uploads",
  [string]$MeiliUrl = $env:MEILI_HOST,
  [string]$MeiliMasterKey = "",
  [switch]$DryRun
)

if (-not (Test-Path $ArchivePath)) {
  Write-Error "Archive not found: $ArchivePath"
  exit 1
}
if (-not $MongoUri) { $MongoUri = $env:MONGO_URL }
if (-not $MongoUri) {
  Write-Error "MONGO_URI not set. Provide -MongoUri or set MONGO_URI env var."
  exit 1
}
if (-not $MeiliUrl) { $MeiliUrl = "http://localhost:7700" }
if (-not $MeiliMasterKey) { $MeiliMasterKey = $env:MEILI_MASTER_KEY }
if (-not $MeiliMasterKey) { $MeiliMasterKey = $env:MEILI_SERVER_KEY }

$extractDir = Join-Path (Split-Path $ArchivePath -Parent) "restore_temp"
if ($DryRun) {
  Write-Host "=== DRY RUN ===" -ForegroundColor Yellow
}

Write-Host "Extracting $ArchivePath ..."
if (-not $DryRun) {
  tar -xzf $ArchivePath -C (Split-Path $ArchivePath -Parent)
}
$archiveBase = [System.IO.Path]::GetFileNameWithoutExtension(
  [System.IO.Path]::GetFileNameWithoutExtension($ArchivePath)
)
$restoreRoot = Join-Path (Split-Path $ArchivePath -Parent) $archiveBase

if (-not (Test-Path $restoreRoot)) {
  Write-Error "Extracted directory not found: $restoreRoot"
  exit 1
}

Write-Host "Restoring from: $restoreRoot" -ForegroundColor Cyan

# ── 1. MongoDB ────────────────────────────────────────────────
$mongoPath = Join-Path $restoreRoot "mongodb" $archiveBase
if (-not (Test-Path $mongoPath)) {
  $mongoPath = Join-Path $restoreRoot "mongodb"
}
if (Test-Path $mongoPath) {
  Write-Host "[1/3] Restoring MongoDB..."
  if ($DryRun) {
    Write-Host "  Would run: mongorestore --uri=... $mongoPath"
  } else {
    $result = mongorestore --uri="$MongoUri" "$mongoPath" 2>&1
    if ($LASTEXITCODE -eq 0) {
      Write-Host "  MongoDB restore OK" -ForegroundColor Green
    } else {
      Write-Warning "mongorestore failed: $result"
    }
  }
} else {
  Write-Warning "MongoDB dump not found in backup, skipping."
}

# ── 2. Uploads ────────────────────────────────────────────────
$uploadsSrc = Join-Path $restoreRoot "uploads"
if (Test-Path $uploadsSrc) {
  Write-Host "[2/3] Restoring uploads to $UploadsDir..."
  if ($DryRun) {
    Write-Host "  Would copy: $uploadsSrc → $UploadsDir"
  } else {
    Copy-Item -Recurse -Path "$uploadsSrc\*" -Destination $UploadsDir -Force -ErrorAction SilentlyContinue
    Write-Host "  Uploads restore OK" -ForegroundColor Green
  }
} else {
  Write-Warning "Uploads not found in backup, skipping."
}

# ── 3. MeiliSearch ────────────────────────────────────────────
$meiliSrc = Join-Path $restoreRoot "meilisearch"
if (Test-Path $meiliSrc) {
  Write-Host "[3/3] Restoring MeiliSearch indexes..."
  Get-ChildItem -Path $meiliSrc -Filter "*.json" | ForEach-Object {
    $indexUid = $_.BaseName
    $documents = Get-Content $_.FullName -Raw | ConvertFrom-Json
    if ($DryRun) {
      Write-Host "  Would restore index '$indexUid' with $($documents.Count) documents"
    } else {
      try {
        $jsonBody = $documents | ConvertTo-Json -Depth 10 -Compress
        Invoke-RestMethod -Uri "${MeiliUrl}/indexes/$indexUid/documents" -Method Post -Headers @{
          "Authorization" = "Bearer $MeiliMasterKey"
          "Content-Type" = "application/json"
        } -Body $jsonBody -ErrorAction Stop | Out-Null
        Write-Host "  Index '$indexUid' restored" -ForegroundColor Green
      } catch {
        Write-Warning "  Failed to restore index '$indexUid': $_"
      }
    }
  }
} else {
  Write-Warning "MeiliSearch dump not found in backup, skipping."
}

# ── Config files (extracted but not auto-restored) ───────────
$configSrc = Join-Path $restoreRoot "config"
if (Test-Path $configSrc) {
  Write-Host ""
  Write-Host "Config files extracted to: $configSrc" -ForegroundColor Yellow
  Write-Host "Review them manually before copying to production." -ForegroundColor Yellow
}

# Clean up extraction temp
if (-not $DryRun -and (Test-Path $extractDir)) {
  Remove-Item -Recurse -Force $extractDir -ErrorAction SilentlyContinue
}

Write-Host "=== Restore complete ===" -ForegroundColor Cyan
