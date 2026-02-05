<#
Download Roboto font TTFs into the template_ui/fonts folder.
Run from PowerShell:
  powershell -ExecutionPolicy Bypass -File .\scripts\download_fonts.ps1
#>

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$fontsDir = Resolve-Path (Join-Path $scriptDir '..\fonts') -ErrorAction SilentlyContinue
if (-not $fontsDir) {
    $fontsDir = Join-Path $scriptDir '..\fonts'
    New-Item -ItemType Directory -Path $fontsDir | Out-Null
}

$candidates = @(
    'https://raw.githubusercontent.com/google/fonts/main/apache/roboto/{0}',
    'https://raw.githubusercontent.com/google/fonts/master/apache/roboto/{0}',
    'https://github.com/google/fonts/raw/main/apache/roboto/{0}',
    'https://github.com/google/fonts/raw/master/apache/roboto/{0}'
)

$files = @('Roboto-Regular.ttf','Roboto-Bold.ttf')

foreach ($name in $files) {
    $out = Join-Path $fontsDir $name
    $saved = $false
    Write-Host "Attempting to download $name..."
    foreach ($tmpl in $candidates) {
        $url = $tmpl -f $name
        try {
            Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing -ErrorAction Stop
            Write-Host "Saved $out from $url"
            $saved = $true
            break
        } catch {
            # try next candidate
        }
    }
    if (-not $saved) {
        Write-Error ("Failed to download {0} from candidate URLs" -f $name)
    }
}

Write-Host "Done. Verify files in: $fontsDir"
