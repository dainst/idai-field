param(
    [string]$ApkPath = '.\dist\android\idai-field-mobile-release.apk',
    [string]$DeviceSerial,
    [switch]$DownloadPlatformTools,
    [switch]$NoLaunch,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = $OutputEncoding

$repoDir = $PSScriptRoot
$packageName = 'kr.idai.fieldmobile'

function Show-Usage {
    Write-Host 'Digital Field Notebook Android APK installer'
    Write-Host ''
    Write-Host 'Usage:'
    Write-Host '  .\install-idai-field-android-apk.ps1 -ApkPath .\dist\android\idai-field-mobile-release.apk'
    Write-Host '  .\install-idai-field-android-apk.ps1 -ApkPath .\idai-field-mobile-release.apk -DownloadPlatformTools'
    Write-Host '  .\install-idai-field-android-apk.ps1 -DeviceSerial R83Y70CADYP'
    Write-Host ''
    Write-Host 'Enable Developer options and USB debugging on the tablet, then approve the USB debugging prompt.'
}

function Resolve-FullPath {
    param([string]$Path)

    if ([System.IO.Path]::IsPathRooted($Path)) {
        return [System.IO.Path]::GetFullPath($Path)
    }

    return [System.IO.Path]::GetFullPath((Join-Path $repoDir $Path))
}

function Assert-ChildPath {
    param(
        [string]$ChildPath,
        [string]$ParentPath
    )

    $resolvedParent = (Resolve-Path -LiteralPath $ParentPath).Path
    $resolvedChild = [System.IO.Path]::GetFullPath($ChildPath)

    if (-not $resolvedChild.StartsWith($resolvedParent, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to operate outside the expected directory: $resolvedChild"
    }
}

function Install-PlatformTools {
    $toolsDir = Join-Path $repoDir '.tools\android'
    New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null

    $zipPath = Join-Path $toolsDir 'platform-tools-latest-windows.zip'
    $platformToolsDir = Join-Path $toolsDir 'platform-tools'
    $downloadUrl = 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip'

    Write-Host 'Downloading Android platform-tools.'
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing

    if (Test-Path -LiteralPath $platformToolsDir) {
        Assert-ChildPath -ChildPath $platformToolsDir -ParentPath $toolsDir
        Remove-Item -LiteralPath $platformToolsDir -Recurse -Force
    }

    Expand-Archive -LiteralPath $zipPath -DestinationPath $toolsDir -Force
    return Join-Path $platformToolsDir 'adb.exe'
}

function Resolve-Adb {
    $candidateFiles = @()

    if ($env:ANDROID_HOME) { $candidateFiles += Join-Path $env:ANDROID_HOME 'platform-tools\adb.exe' }
    if ($env:ANDROID_SDK_ROOT) { $candidateFiles += Join-Path $env:ANDROID_SDK_ROOT 'platform-tools\adb.exe' }
    if ($env:LOCALAPPDATA) { $candidateFiles += Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe' }
    $candidateFiles += Join-Path $repoDir '.tools\android\platform-tools\adb.exe'

    $adbCommand = Get-Command adb.exe -ErrorAction SilentlyContinue
    if (-not $adbCommand) {
        $adbCommand = Get-Command adb -ErrorAction SilentlyContinue
    }
    if ($adbCommand) {
        $candidateFiles += $adbCommand.Source
    }

    foreach ($candidateFile in $candidateFiles) {
        if ($candidateFile -and (Test-Path -LiteralPath $candidateFile)) {
            return (Resolve-Path -LiteralPath $candidateFile).Path
        }
    }

    if ($DownloadPlatformTools) {
        return Install-PlatformTools
    }

    throw 'adb was not found. Install Android SDK platform-tools or rerun with -DownloadPlatformTools.'
}

function Get-ConnectedDevices {
    param([string]$Adb)

    $devices = @()
    $problemRows = @()
    $lines = & $Adb devices -l
    foreach ($line in ($lines | Select-Object -Skip 1)) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }

        if ($line -match '^(\S+)\s+device\s*(.*)$') {
            $devices += [pscustomobject]@{
                Serial = $Matches[1]
                Details = $Matches[2]
            }
        } elseif ($line -match '^(\S+)\s+(unauthorized|offline)\s*(.*)$') {
            $problemRows += $line
        }
    }

    if ($devices.Count -eq 0) {
        if ($problemRows.Count -gt 0) {
            Write-Host 'A device is visible but unauthorized or offline:'
            $problemRows | ForEach-Object { Write-Host "  $_" }
        }
        throw 'No installable Android device was found. Approve the USB debugging prompt and try again.'
    }

    return $devices
}

function Select-Device {
    param(
        [array]$Devices,
        [string]$Serial
    )

    if ($Serial) {
        $selected = $Devices | Where-Object { $_.Serial -eq $Serial } | Select-Object -First 1
        if (-not $selected) {
            throw "The requested device was not found: $Serial"
        }
        return $selected.Serial
    }

    if ($Devices.Count -gt 1) {
        Write-Host 'Multiple devices are connected. Select one with -DeviceSerial.'
        $Devices | ForEach-Object { Write-Host "  $($_.Serial) $($_.Details)" }
        throw 'An install target device must be selected.'
    }

    return $Devices[0].Serial
}

if ($Help) {
    Show-Usage
    exit 0
}

try {
    $fullApkPath = Resolve-FullPath -Path $ApkPath
    if (-not (Test-Path -LiteralPath $fullApkPath)) {
        throw "APK file was not found: $fullApkPath"
    }

    $adb = Resolve-Adb
    $devices = Get-ConnectedDevices -Adb $adb
    $serial = Select-Device -Devices $devices -Serial $DeviceSerial

    Write-Host "Install target: $serial"
    & $adb -s $serial install -r -d $fullApkPath
    if ($LASTEXITCODE -ne 0) { throw 'adb install failed' }

    Write-Host ''
    Write-Host 'APK installation completed.'

    if (-not $NoLaunch) {
        Write-Host 'Launching the app.'
        & $adb -s $serial shell monkey -p $packageName -c android.intent.category.LAUNCHER 1 | Out-Null
    }
} catch {
    Write-Host ''
    Write-Host "Android APK installation failed: $($_.Exception.Message)"
    exit 1
}
