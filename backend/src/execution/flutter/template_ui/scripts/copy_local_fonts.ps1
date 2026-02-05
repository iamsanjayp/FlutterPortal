<#
Copy available system TTF fonts into the template_ui/fonts folder and name them
`Roboto-Regular.ttf` and `Roboto-Bold.ttf` so the template pubspec can use them.

Run from PowerShell:
  powershell -ExecutionPolicy Bypass -File .\scripts\copy_local_fonts.ps1
#>

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$fontsDir = Resolve-Path (Join-Path $scriptDir '..\fonts') -ErrorAction SilentlyContinue
if (-not $fontsDir) {
    $fontsDir = Join-Path $scriptDir '..\fonts'
    New-Item -ItemType Directory -Path $fontsDir | Out-Null
    $fontsDir = Resolve-Path $fontsDir
}

$sysFonts = Join-Path $env:windir 'Fonts'
if (-not (Test-Path $sysFonts)) {
    Write-Error "System fonts folder not found: $sysFonts"
    exit 1
}

$preferred = @('Roboto-Regular.ttf','Roboto-Bold.ttf','segoeui.ttf','SegoeUI.ttf','Arial.ttf','arial.ttf')
$found = @()

foreach ($p in $preferred) {
    $matches = Get-ChildItem -Path $sysFonts -Filter $p -File -ErrorAction SilentlyContinue
    if ($matches) {
        foreach ($m in $matches) { $found += $m }
        if ($found.Count -ge 2) { break }
    }
}

if ($found.Count -lt 2) {
    $more = Get-ChildItem -Path $sysFonts -Filter *.ttf -File | Where-Object { $found -notcontains $_ }
    foreach ($m in $more) {
        $found += $m
        if ($found.Count -ge 2) { break }
    }
}

if ($found.Count -eq 0) {
    Write-Error "No .ttf fonts found in $sysFonts"
    exit 1
}

if ($found.Count -eq 1) { $found += $found[0] }

$destRegular = Join-Path $fontsDir 'Roboto-Regular.ttf'
$destBold = Join-Path $fontsDir 'Roboto-Bold.ttf'

Copy-Item -Path $found[0].FullName -Destination $destRegular -Force
Copy-Item -Path $found[1].FullName -Destination $destBold -Force

Write-Host "Copied $($found[0].Name) -> $destRegular"
Write-Host "Copied $($found[1].Name) -> $destBold"
Write-Host "Done. Verify files in: $fontsDir"
