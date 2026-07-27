param(
  [string]$MongoUri = $env:MONGO_URI,
  [string]$BackupDir = ".\backups",
  [int]$RetentionDays = 30,
  [string]$DbName = ""
)

if (-not $MongoUri) {
  # Try common env vars
  $MongoUri = $env:MONGO_URL
}
if (-not $MongoUri) {
  Write-Error "MONGO_URI not set. Usage: .\backup-mongodb.ps1 -MongoUri 'mongodb://...'"
  exit 1
}

# Create backup directory
$timestamp = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$dbName = if ($DbName) { $DbName } else { ($MongoUri -split '/')[-1] -split '\?'[0] }
$backupPath = Join-Path $BackupDir "${dbName}_${timestamp}"

# Ensure target directory exists
New-Item -ItemType Directory -Path $backupPath -Force | Out-Null

Write-Host "Starting MongoDB backup of '$dbName'..."
Write-Host "Target: $backupPath"

# Run mongodump
$result = mongodump --uri="$MongoUri" --out="$backupPath" 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Error "mongodump failed: $result"
  exit 1
}
Write-Host "Backup completed successfully."

# Compress backup
$archivePath = "${backupPath}.tar.gz"
if (Get-Command tar -ErrorAction SilentlyContinue) {
  tar -czf $archivePath -C $BackupDir "${dbName}_${timestamp}"
  if ($LASTEXITCODE -eq 0) {
    Remove-Item -Recurse -Force $backupPath
    Write-Host "Compressed to: $archivePath"
  }
}

# Cleanup old backups
$oldBackups = Get-ChildItem -Path $BackupDir -Filter "${dbName}_*.tar.gz" | Where-Object {
  $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays)
}
foreach ($old in $oldBackups) {
  Remove-Item -Path $old.FullName -Force
  Write-Host "Removed old backup: $($old.Name)"
}

Write-Host "Backup complete. Retention: $RetentionDays days."
