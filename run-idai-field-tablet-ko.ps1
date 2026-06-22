param(
    [switch]$InstallDebug,
    [string]$DeviceSerial,
    [int]$Port = 8081,
    [switch]$NoLaunch,
    [switch]$CheckOnly,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = $OutputEncoding

$repoDir = $PSScriptRoot
$coreDir = Join-Path $repoDir 'core'
$mobileDir = Join-Path $repoDir 'mobile'
$androidDir = Join-Path $mobileDir 'android'
$packageName = 'kr.idai.fieldmobile'

function Show-Usage {
    Write-Host 'Digital Field Notebook Android tablet launcher'
    Write-Host ''
    Write-Host 'Usage:'
    Write-Host '  .\run-idai-field-tablet-ko.ps1                 # Run an installed development build over USB'
    Write-Host '  .\run-idai-field-tablet-ko.ps1 -InstallDebug   # Build and install the debug APK, then run Metro'
    Write-Host '  .\run-idai-field-tablet-ko.ps1 -NoLaunch       # Start Metro only'
    Write-Host '  .\run-idai-field-tablet-ko.ps1 -CheckOnly      # Check local runtime'
    Write-Host ''
    Write-Host 'Expo Go is not used. This app needs a development build or APK because it uses native modules.'
}

function Resolve-NodeDir {
    $candidateDirs = @()

    if ($env:LOCALAPPDATA) {
        $codexRuntimeRoot = Join-Path $env:LOCALAPPDATA 'OpenAI\Codex\runtimes'
        if (Test-Path -LiteralPath $codexRuntimeRoot) {
            $candidateDirs += Get-ChildItem -LiteralPath $codexRuntimeRoot -Recurse -Filter npm.cmd -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime -Descending |
                ForEach-Object { $_.DirectoryName }
        }
    }

    $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (-not $npmCommand) {
        $npmCommand = Get-Command npm -ErrorAction SilentlyContinue
    }
    if ($npmCommand) {
        $candidateDirs += Split-Path -Parent $npmCommand.Source
    }

    foreach ($candidateDir in $candidateDirs) {
        if ($candidateDir -and
            (Test-Path -LiteralPath (Join-Path $candidateDir 'node.exe')) -and
            (Test-Path -LiteralPath (Join-Path $candidateDir 'npm.cmd'))) {
            return $candidateDir
        }
    }

    throw 'Node/npm runtime was not found. Install Node.js or launch Codex once to restore its bundled Node runtime.'
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

    throw 'adb was not found. Prepare platform-tools with install-idai-field-android-apk.ps1 -DownloadPlatformTools.'
}

function Get-ConnectedDevices {
    param([string]$Adb)

    $devices = @()
    $lines = & $Adb devices -l
    foreach ($line in ($lines | Select-Object -Skip 1)) {
        if ($line -match '^(\S+)\s+device\s*(.*)$') {
            $devices += [pscustomobject]@{
                Serial = $Matches[1]
                Details = $Matches[2]
            }
        }
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

    if ($Devices.Count -eq 0) {
        throw 'No Android device is connected. Enable USB debugging and approve the prompt.'
    }

    if ($Devices.Count -gt 1) {
        Write-Host 'Multiple devices are connected. Select one with -DeviceSerial.'
        $Devices | ForEach-Object { Write-Host "  $($_.Serial) $($_.Details)" }
        throw 'A target device must be selected.'
    }

    return $Devices[0].Serial
}

function Invoke-NpmInstallIfNeeded {
    param(
        [string]$PackageDir,
        [string]$PackageName
    )

    if (-not (Test-Path -LiteralPath (Join-Path $PackageDir 'node_modules'))) {
        Write-Host "Installing $PackageName dependencies."
        Push-Location -LiteralPath $PackageDir
        try {
            & npm install --legacy-peer-deps
            if ($LASTEXITCODE -ne 0) { throw "$PackageName npm install failed" }
        } finally {
            Pop-Location
        }
    }
}

if ($Help) {
    Show-Usage
    exit 0
}

try {
    $nodeDir = Resolve-NodeDir

    if (-not (Test-Path -LiteralPath (Join-Path $mobileDir 'package.json'))) {
        throw "Mobile package was not found: $mobileDir"
    }
    if (-not (Test-Path -LiteralPath (Join-Path $androidDir 'gradlew.bat'))) {
        throw "Android project was not found: $androidDir"
    }

    if ($CheckOnly) {
        $adb = Resolve-Adb
        $devices = Get-ConnectedDevices -Adb $adb
        Write-Host 'Tablet launcher check passed.'
        Write-Host "Node/npm runtime: $nodeDir"
        Write-Host "Mobile app: $mobileDir"
        Write-Host "adb: $adb"
        if ($devices.Count -gt 0) {
            Write-Host 'Connected devices:'
            $devices | ForEach-Object { Write-Host "  $($_.Serial) $($_.Details)" }
        }
        exit 0
    }

    $env:Path = "$nodeDir;$env:Path"

    if ($InstallDebug) {
        $buildScript = Join-Path $repoDir 'build-idai-field-android-apk.ps1'
        $buildArgs = @('-Variant', 'debug', '-Install')
        if ($DeviceSerial) { $buildArgs += @('-DeviceSerial', $DeviceSerial) }
        & $buildScript @buildArgs
        if ($LASTEXITCODE -ne 0) { throw 'Debug APK installation failed' }
    }

    Invoke-NpmInstallIfNeeded -PackageDir $coreDir -PackageName 'core'
    Invoke-NpmInstallIfNeeded -PackageDir $mobileDir -PackageName 'mobile'

    Write-Host 'Building core package.'
    Push-Location -LiteralPath $coreDir
    try {
        & npm run build
        if ($LASTEXITCODE -ne 0) { throw 'core build failed' }
    } finally {
        Pop-Location
    }

    $adb = Resolve-Adb
    $devices = Get-ConnectedDevices -Adb $adb
    $serial = Select-Device -Devices $devices -Serial $DeviceSerial

    Write-Host "Configuring USB port forwarding: tcp:$Port"
    & $adb -s $serial reverse "tcp:$Port" "tcp:$Port"
    if ($LASTEXITCODE -ne 0) { throw 'adb reverse failed' }

    if (-not $NoLaunch) {
        Write-Host 'The tablet app will launch after Metro starts.'
        $launchCommand = "Start-Sleep -Seconds 6; & `"$adb`" -s `"$serial`" shell monkey -p $packageName -c android.intent.category.LAUNCHER 1 | Out-Null"
        Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile', '-WindowStyle', 'Hidden', '-Command', $launchCommand) -WindowStyle Hidden | Out-Null
    }

    Write-Host 'Starting the Metro development server.'
    Set-Location -LiteralPath $mobileDir
    & npx expo start --dev-client --host localhost --port $Port --clear
} catch {
    Write-Host ''
    Write-Host "Tablet startup failed: $($_.Exception.Message)"
    exit 1
}
