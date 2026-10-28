$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'work/session-env.ps1')) {
    . (Join-Path $PSScriptRoot 'work/session-env.ps1')
}
node tools/run_python.mjs tools/project_launcher.py --open
