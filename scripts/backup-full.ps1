<#
.SYNOPSIS
  Full production backup: MongoDB, uploaded files, MeiliSearch indexes, and config.
.DESCRIPTION
  Creates a timestamped backup archive containing:
    - MongoDB dump (via mongodump)
    - Uploads directory (images, files, avatars)
    - MeiliSearch index dump (via curl to MeiliSearch export endpoint)
    - Application config (librechat.yaml, .env)
  Automatically prunes backups older than RetentionDays.
.PARAMETER MongoUri
  MongoDB connection URI. Falls back to MONGO_URI or MONGO_URL env vars.
.PARAMETER BackupDir
  Directory to store backups. Default: ./backups
.PARAMETER RetentionDays
  Delete backups older than this. Default: 30
.PARAMETER UploadsDir
  Path to uploads directory. Default: ./uploads
.PARAMETER MeiliUrl
  MeiliSearch URL. Falls back to MEILI_HOST env var. Default: http://localhost:7700
.PARAMETER MeiliMasterKey
  MeiliSearch master key. Falls back to MEILI_MASTER_KEY or MEILI_SERVER_KEY env var.
.PARAMETER ConfigDir
  Path containing librechat.yaml and .env. Default: .
#>

param(
  [string]$MongoUri = $env:MONGO_URI,
  [string]$BackupDir = ".\backups",
  [int]$RetentionDays = 30,
  [string]$UploadsDir = ".\uploads",
  [string]$MeiliUrl = $env:MEILI_HOST,
  [string]$MeiliMasterKey = "",
  [string]$ConfigDir = "."
)

# ── Resolve defaults ──────────────────────────────────────────
if (-not $MongoUri) { $MongoUri = $env:MONGO_URL }
if (-not $MongoUri) {
  Write-Error "MONGO_URI is not set. Provide -MongoUri or set MONGO_URI env var."
  exit 1
}
if (-not $MeiliUrl) { $MeiliUrl = "http://localhost:7700" }
if (-not $MeiliMasterKey) { $MeiliMasterKey = $env:MEILI_MASTER_KEY }
if (-not $MeiliMasterKey) { $MeiliMasterKey = $env:MEILI_SERVER_KEY }

# ── Prepare backup directory ──────────────────────────────────
$timestamp = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$dbName = ($MongoUri -split '/')[-1] -split '\?'[0]
if (-not $dbName) { $dbName = "LibreChat" }
$backupRoot = Join-Path $BackupDir "full_${dbName}_${timestamp}"
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
Write-Host "=== Full backup to: $backupRoot ===" -ForegroundColor Cyan

# ── 1. MongoDB ────────────────────────────────────────────────
$mongoPath = Join-Path $backupRoot "mongodb"
New-Item -ItemType Directory -Path $mongoPath -Force | Out-Null
Write-Host "[1/4] Dumping MongoDB '$dbName'..."
$result = mongodump --uri="$MongoUri" --out="$mongoPath" 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Warning "mongodump failed: $result"
} else {
  Write-Host "  MongoDB dump OK" -ForegroundColor Green
}

# ── 2. Uploads ────────────────────────────────────────────────
Write-Host "[2/4] Copying uploads from '$UploadsDir'..."
if (Test-Path $UploadsDir) {
  $uploadsDest = Join-Path $backupRoot "uploads"
  Copy-Item -Recurse -Path $UploadsDir -Destination $uploadsDest -ErrorAction SilentlyContinue
  Write-Host "  Uploads copied OK" -ForegroundColor Green
} else {
  Write-Warning "Uploads directory '$UploadsDir' not found, skipping."
}

# ── 3. MeiliSearch index dump ─────────────────────────────────
Write-Host "[3/4] Exporting MeiliSearch indexes..."
$meiliDest = Join-Path $backupRoot "meilisearch"
New-Item -ItemType Directory -Path $meiliDest -Force | Out-Null

try {
  $indexesResponse = Invoke-RestMethod -Uri "${MeiliUrl}/indexes" -Method Get -Headers @{
    "Authorization" = "Bearer $MeiliMasterKey"
  } -ErrorAction Stop
  $indexes = $indexesResponse.results
  if (-not $indexes) { $indexes = $indexesResponse }

  foreach ($idx in $indexes) {
    $uid = $idx.uid
    $dumpPath = Join-Path $meiliDest "${uid}.json"
    try {
      $docs = Invoke-RestMethod -Uri "${MeiliUrl}/indexes/$uid/documents" -Method Get -Headers @{
        "Authorization" = "Bearer $MeiliMasterKey"
      } -ErrorAction SilentlyContinue
      $docs | ConvertTo-Json -Depth 10 | Set-Content -Path $dumpPath -Encoding UTF8
      Write-Host "  Index '$uid' exported" -ForegroundColor Green
    } catch {
      Write-Warning "  Failed to export index '$uid': $_"
    }
  }
} catch {
  Write-Warning "MeiliSearch export failed (is it running?): $_"
}

# ── 4. Config files ───────────────────────────────────────────
Write-Host "[4/4] Copying config files..."
$configDest = Join-Path $backupRoot "config"
New-Item -ItemType Directory -Path $configDest -Force | Out-Null

$configFiles = @("librechat.yaml", ".env")
foreach ($file in $configFiles) {
  $srcPath = Join-Path $ConfigDir $file
  if (Test-Path $srcPath) {
    Copy-Item -Path $srcPath -Destination (Join-Path $configDest $file)
    Write-Host "  $file copied" -ForegroundColor Green
  } else {
    Write-Warning "  $file not found at '$ConfigDir', skipping."
  }
}

# ── Compress ──────────────────────────────────────────────────
$archiveFile = "${backupRoot}.tar.gz"
Write-Host "Compressing to $archiveFile ..."
if (Get-Command tar -ErrorAction SilentlyContinue) {
  pushd $BackupDir
  tar -czf $archiveFile "full_${dbName}_${timestamp}" 2>&1
  popd
  if ($LASTEXITCODE -eq 0) {
    Remove-Item -Recurse -Force $backupRoot
    Write-Host "Compressed OK: $archiveFile" -ForegroundColor Green
  }
}

# ── Prune old backups ─────────────────────────────────────────
Write-Host "Pruning backups older than $RetentionDays days..."
$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "full_${dbName}_*.tar.gz" | Where-Object {
  $_.LastWriteTime -lt $cutoff
} | ForEach-Object {
  Remove-Item -Path $_.FullName -Force
  Write-Host "  Removed: $($_.Name)" -ForegroundColor Yellow
}

Write-Host "=== Backup complete ===" -ForegroundColor Cyan
