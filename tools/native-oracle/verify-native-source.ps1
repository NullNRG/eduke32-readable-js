$ErrorActionPreference = 'Stop'
$project = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$manifest = Get-Content -LiteralPath (Join-Path $project 'reports\native-oracle-source-hashes.json') -Raw | ConvertFrom-Json
$mismatches = @()
$missing = @()
$checked = 0
foreach ($file in $manifest.files.PSObject.Properties) {
  $path = Join-Path (Join-Path $project 'work\native-oracle') $file.Name
  if (-not (Test-Path -LiteralPath $path)) { $missing += $file.Name; continue }
  $actual = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actual -ne $file.Value) { $mismatches += [ordered]@{ path = $file.Name; expected = $file.Value; actual = $actual } }
  $checked++
}
$report = [ordered]@{
  checkedAt = [DateTime]::UtcNow.ToString('o')
  checkedOriginalFiles = $checked
  missingOriginalFiles = $missing
  modifiedOriginalFiles = $mismatches
  passed = ($missing.Count -eq 0 -and $mismatches.Count -eq 0)
  archiveSha256 = $manifest.archive_sha256
}
$report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $project 'reports\native-oracle-source-verification.json') -Encoding utf8
$report | ConvertTo-Json -Depth 8
