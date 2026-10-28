$ErrorActionPreference = 'Stop'
$project = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$nativeWorkspace = Join-Path $project 'work/native-oracle'
New-Item -ItemType Directory -Force -Path $nativeWorkspace | Out-Null
$toolchain = if ($env:EDUKE32_NATIVE_TOOLCHAIN) { $env:EDUKE32_NATIVE_TOOLCHAIN } else { 'C:\Users\andre\AppData\Local\Microsoft\WinGet\Packages\BrechtSanders.WinLibs.MCF.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\mingw64\bin' }
$source = Join-Path $nativeWorkspace 'flac-1.3.0'
$build = Join-Path $nativeWorkspace 'flac-ucrt'
$archive = Join-Path $nativeWorkspace 'flac-1.3.0.zip'
$url = 'https://codeload.github.com/xiph/flac/zip/refs/tags/1.3.0'
if (-not (Test-Path -LiteralPath $source)) {
  & curl.exe -L --fail --retry 2 -o $archive $url
  if ($LASTEXITCODE -ne 0) { throw 'Failed to download original FLAC 1.3.0 source.' }
  Expand-Archive -LiteralPath $archive -DestinationPath $nativeWorkspace
}
if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant() -ne '9d2d14f63132ea409cd47cabd27b718e66220286544b8a4c139c6b9e488d0a58') { throw 'FLAC 1.3.0 source archive checksum mismatch.' }
New-Item -ItemType Directory -Force -Path (Join-Path $build 'obj'),(Join-Path $build 'lib') | Out-Null
$configuration = @'
#define HAVE_STDINT_H 1
#define HAVE_INTTYPES_H 1
#define HAVE_FSEEKO 1
#define HAVE_FTELLO 1
#define HAVE_LROUND 1
#define SIZEOF_VOIDP 8
#define WORDS_BIGENDIAN 0
#define FLAC__NO_ASM 1
#define FLAC__ALIGN_MALLOC_DATA 1
#define FLAC__HAS_OGG 0
#define FLAC__NO_DLL 1
#define VERSION "1.3.0"
'@
$configPath = Join-Path $build 'native-build-config.h'
$configuration | Set-Content -LiteralPath $configPath -Encoding utf8
$sources = @('bitmath','bitreader','bitwriter','cpu','crc','fixed','float','format','lpc','md5','memory','metadata_iterators','metadata_object','stream_decoder','stream_encoder','stream_encoder_framing','window') | ForEach-Object { Join-Path $source "src/libFLAC/$_.c" }
$sources += Join-Path $source 'src/share/win_utf8_io/win_utf8_io.c'
$commands = @()
$report = [ordered]@{ status='running'; version='1.3.0'; sourceUrl=$url; archiveSha256=(Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant(); reason='Archived libFLAC 1.3.0 requires legacy MSVCRT __imp___iob_func; rebuild same upstream version with installed UCRT toolchain'; configuration=$configuration; sourceModifications=@(); commands=@(); startedAt=[DateTime]::UtcNow.ToString('o') }
$reportPath = Join-Path $project 'reports/native-flac-build.json'
$logPath = Join-Path $project 'reports/native-flac-build.log'
$report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $reportPath -Encoding utf8
'' | Set-Content -LiteralPath $logPath -Encoding utf8
try {
  foreach ($file in $sources) {
    $object = Join-Path $build ('obj/' + [IO.Path]::GetFileNameWithoutExtension($file) + '.o')
    $arguments = @('-std=gnu99','-O1','-I' + (Join-Path $source 'include'),'-I' + (Join-Path $source 'src/libFLAC/include'),'-include',$configPath,'-c',$file,'-o',$object)
    $commands += [ordered]@{ executable=(Join-Path $toolchain 'gcc.exe'); arguments=$arguments }
    & (Join-Path $toolchain 'gcc.exe') @arguments *>> $logPath
    if ($LASTEXITCODE -ne 0) { throw "FLAC source compile failed: $file (exit $LASTEXITCODE)" }
  }
  $library = Join-Path $build 'lib/libFLAC.a'
  $arguments = @('rcs',$library) + @(Get-ChildItem -LiteralPath (Join-Path $build 'obj') -Filter '*.o' | Sort-Object Name | ForEach-Object FullName)
  $commands += [ordered]@{ executable=(Join-Path $toolchain 'ar.exe'); arguments=$arguments }
  & (Join-Path $toolchain 'ar.exe') @arguments *>> $logPath
  if ($LASTEXITCODE -ne 0) { throw 'FLAC archive creation failed.' }
  $report.status = 'built'
  $report.library = $library
  $report.librarySha256 = (Get-FileHash -LiteralPath $library -Algorithm SHA256).Hash.ToLowerInvariant()
} catch {
  $report.status = 'failed'
  $report.exception = $_.Exception.ToString()
} finally {
  $report.commands = $commands
  $report.finishedAt = [DateTime]::UtcNow.ToString('o')
  $report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $reportPath -Encoding utf8
}
