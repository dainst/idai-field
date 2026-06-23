param(
    [ValidateSet('release', 'debug')]
    [string]$Variant = 'release',
    [switch]$Install,
    [string]$DeviceSerial,
    [switch]$SkipNpmInstall,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = $OutputEncoding

$repoDir = $PSScriptRoot
$coreDir = Join-Path $repoDir 'core'
$mobileDir = Join-Path $repoDir 'mobile'
$androidDir = Join-Path $mobileDir 'android'
$distDir = Join-Path $repoDir 'dist\android'

function Show-Usage {
    Write-Host 'Digital Field Notebook Android APK builder'
    Write-Host ''
    Write-Host 'Usage:'
    Write-Host '  .\build-idai-field-android-apk.ps1'
    Write-Host '  .\build-idai-field-android-apk.ps1 -Variant debug -Install'
    Write-Host '  .\build-idai-field-android-apk.ps1 -Variant release -SkipNpmInstall'
    Write-Host ''
    Write-Host 'Requires Node.js/npm, JDK 17+, and Android SDK with platform-tools.'
}

function Resolve-NodeDir {
    $candidateDirs = @()

    $npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (-not $npmCommand) {
        $npmCommand = Get-Command npm -ErrorAction SilentlyContinue
    }
    if ($npmCommand) {
        $candidateDirs += Split-Path -Parent $npmCommand.Source
    }

    if ($env:LOCALAPPDATA) {
        $codexRuntimeRoot = Join-Path $env:LOCALAPPDATA 'OpenAI\Codex\runtimes'
        if (Test-Path -LiteralPath $codexRuntimeRoot) {
            $candidateDirs += Get-ChildItem -LiteralPath $codexRuntimeRoot -Recurse -Filter npm.cmd -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime -Descending |
                ForEach-Object { $_.DirectoryName }
        }
    }

    foreach ($candidateDir in $candidateDirs) {
        if ($candidateDir -and
            (Test-Path -LiteralPath (Join-Path $candidateDir 'node.exe')) -and
            (Test-Path -LiteralPath (Join-Path $candidateDir 'npm.cmd'))) {
            return $candidateDir
        }
    }

    throw 'Node/npm was not found. Install Node.js 20 or newer and try again.'
}

function Get-JavaMajorVersion {
    param([string]$JavaExe)

    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $versionText = (& $JavaExe -version 2>&1 | Out-String)
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    if ($versionText -notmatch 'version "([0-9]+)(?:\.([0-9]+))?') {
        throw "Could not detect Java version: $JavaExe"
    }

    $major = [int]$Matches[1]
    if ($major -eq 1 -and $Matches[2]) {
        return [int]$Matches[2]
    }

    return $major
}

function Resolve-JavaHome {
    $javaCandidates = @()

    if ($env:JAVA_HOME) {
        $javaCandidates += Join-Path $env:JAVA_HOME 'bin\java.exe'
    }

    $javaCommand = Get-Command java.exe -ErrorAction SilentlyContinue
    if (-not $javaCommand) {
        $javaCommand = Get-Command java -ErrorAction SilentlyContinue
    }
    if ($javaCommand) {
        $javaCandidates += $javaCommand.Source
    }

    $javaInstallRoots = @()
    if ($env:ProgramFiles) {
        $javaInstallRoots += Join-Path $env:ProgramFiles 'Eclipse Adoptium'
        $javaInstallRoots += Join-Path $env:ProgramFiles 'Java'
    }
    if (${env:ProgramFiles(x86)}) {
        $javaInstallRoots += Join-Path ${env:ProgramFiles(x86)} 'Eclipse Adoptium'
        $javaInstallRoots += Join-Path ${env:ProgramFiles(x86)} 'Java'
    }

    foreach ($javaInstallRoot in $javaInstallRoots) {
        if (-not $javaInstallRoot -or -not (Test-Path -LiteralPath $javaInstallRoot)) { continue }
        $javaCandidates += Get-ChildItem -LiteralPath $javaInstallRoot -Recurse -Filter java.exe -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -match '\\bin\\java\.exe$' } |
            Sort-Object FullName -Descending |
            ForEach-Object { $_.FullName }
    }

    foreach ($javaExe in $javaCandidates) {
        if (-not (Test-Path -LiteralPath $javaExe)) { continue }

        $major = Get-JavaMajorVersion -JavaExe $javaExe
        if ($major -ge 17) {
            return Split-Path -Parent (Split-Path -Parent $javaExe)
        }
    }

    throw 'JDK 17 or newer was not found. Install Temurin/OpenJDK 17+ and set JAVA_HOME.'
}

function Resolve-AndroidSdk {
    $candidateDirs = @()

    if ($env:ANDROID_HOME) { $candidateDirs += $env:ANDROID_HOME }
    if ($env:ANDROID_SDK_ROOT) { $candidateDirs += $env:ANDROID_SDK_ROOT }
    if ($env:LOCALAPPDATA) { $candidateDirs += Join-Path $env:LOCALAPPDATA 'Android\Sdk' }

    foreach ($candidateDir in $candidateDirs) {
        if ($candidateDir -and
            (Test-Path -LiteralPath $candidateDir) -and
            (Test-Path -LiteralPath (Join-Path $candidateDir 'platform-tools\adb.exe'))) {
            return (Resolve-Path -LiteralPath $candidateDir).Path
        }
    }

    throw 'Android SDK was not found. Install Android Studio or cmdline-tools with platform-tools.'
}

function Invoke-NpmInstallIfNeeded {
    param(
        [string]$PackageDir,
        [string]$PackageName
    )

    if ($SkipNpmInstall) { return }

    if (-not (Test-Path -LiteralPath (Join-Path $PackageDir 'node_modules'))) {
        Write-Host "Installing $PackageName dependencies. The first run can take a few minutes."
        Push-Location -LiteralPath $PackageDir
        try {
            & npm install --legacy-peer-deps
            if ($LASTEXITCODE -ne 0) { throw "$PackageName npm install failed" }
        } finally {
            Pop-Location
        }
    }
}

function Invoke-CheckedCommand {
    param(
        [string]$Command,
        [string[]]$Arguments,
        [string]$WorkingDirectory
    )

    Push-Location -LiteralPath $WorkingDirectory
    try {
        & $Command @Arguments
        if ($LASTEXITCODE -ne 0) {
            throw "$Command $($Arguments -join ' ') failed"
        }
    } finally {
        Pop-Location
    }
}

function Assert-PathIsInside {
    param(
        [string]$Path,
        [string]$ParentPath
    )

    $resolvedPath = (Resolve-Path -LiteralPath $Path).Path
    $resolvedParentPath = (Resolve-Path -LiteralPath $ParentPath).Path
    $parentPrefix = $resolvedParentPath.TrimEnd('\') + '\'

    if (-not $resolvedPath.StartsWith($parentPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to modify path outside expected directory: $resolvedPath"
    }

    return $resolvedPath
}

function Sync-LocalCorePackageForMobile {
    $coreDistDir = Join-Path $coreDir 'dist'
    $mobileCorePackageDir = Join-Path $mobileDir 'node_modules\idai-field-core'

    if (-not (Test-Path -LiteralPath $coreDistDir)) {
        throw "Built core package was not found: $coreDistDir"
    }
    if (-not (Test-Path -LiteralPath $mobileCorePackageDir)) {
        throw "mobile idai-field-core package was not found: $mobileCorePackageDir"
    }

    $resolvedPackageDir = Assert-PathIsInside -Path $mobileCorePackageDir -ParentPath $mobileDir
    $targetDistDir = Join-Path $resolvedPackageDir 'dist'

    if (Test-Path -LiteralPath $targetDistDir) {
        $resolvedTargetDistDir = Assert-PathIsInside -Path $targetDistDir -ParentPath $resolvedPackageDir
        Remove-Item -LiteralPath $resolvedTargetDistDir -Recurse -Force
    }

    Copy-Item -LiteralPath $coreDistDir -Destination $resolvedPackageDir -Recurse -Force
    Copy-Item -LiteralPath (Join-Path $coreDir 'package.json') -Destination (Join-Path $resolvedPackageDir 'package.json') -Force
    Copy-Item -LiteralPath (Join-Path $coreDir 'README.md') -Destination (Join-Path $resolvedPackageDir 'README.md') -Force

    Write-Host 'Synced local core package into mobile node_modules.'
}

if ($Help) {
    Show-Usage
    exit 0
}

try {
    if (-not (Test-Path -LiteralPath (Join-Path $coreDir 'package.json'))) {
        throw "core package was not found: $coreDir"
    }
    if (-not (Test-Path -LiteralPath (Join-Path $mobileDir 'package.json'))) {
        throw "mobile package was not found: $mobileDir"
    }
    if (-not (Test-Path -LiteralPath (Join-Path $androidDir 'gradlew.bat'))) {
        throw "Android project was not found: $androidDir"
    }

    $nodeDir = Resolve-NodeDir
    $javaHome = Resolve-JavaHome
    $androidSdk = Resolve-AndroidSdk

    $env:JAVA_HOME = $javaHome
    $env:ANDROID_HOME = $androidSdk
    $env:ANDROID_SDK_ROOT = $androidSdk
    $env:Path = "$nodeDir;$(Join-Path $javaHome 'bin');$(Join-Path $androidSdk 'platform-tools');$env:Path"

    Write-Host "Node/npm: $nodeDir"
    Write-Host "JAVA_HOME: $javaHome"
    Write-Host "ANDROID_HOME: $androidSdk"

    Invoke-NpmInstallIfNeeded -PackageDir $coreDir -PackageName 'core'
    Invoke-NpmInstallIfNeeded -PackageDir $mobileDir -PackageName 'mobile'

    Write-Host 'Building core package.'
    Invoke-CheckedCommand -Command 'npm' -Arguments @('run', 'build') -WorkingDirectory $coreDir
    Sync-LocalCorePackageForMobile

    $variantPascal = if ($Variant -eq 'debug') { 'Debug' } else { 'Release' }
    $bundleTask = "app:createBundle${variantPascal}JsAndAssets"
    Write-Host "Refreshing Android JS bundle: $bundleTask"
    Invoke-CheckedCommand -Command (Join-Path $androidDir 'gradlew.bat') -Arguments @('--no-daemon', '--rerun-tasks', $bundleTask) -WorkingDirectory $androidDir

    $gradleTask = if ($Variant -eq 'debug') { 'app:assembleDebug' } else { 'app:assembleRelease' }
    Write-Host "Building Android APK: $gradleTask"
    Invoke-CheckedCommand -Command (Join-Path $androidDir 'gradlew.bat') -Arguments @('--no-daemon', $gradleTask) -WorkingDirectory $androidDir

    $sourceApk = Join-Path $androidDir "app\build\outputs\apk\$Variant\app-$Variant.apk"
    if (-not (Test-Path -LiteralPath $sourceApk)) {
        throw "APK output was not found: $sourceApk"
    }

    New-Item -ItemType Directory -Force -Path $distDir | Out-Null
    $targetApk = Join-Path $distDir "idai-field-mobile-$Variant.apk"
    Copy-Item -LiteralPath $sourceApk -Destination $targetApk -Force

    Write-Host ''
    Write-Host "APK created: $targetApk"

    if ($Install) {
        $installScript = Join-Path $repoDir 'install-idai-field-android-apk.ps1'
        $installArgs = @('-ApkPath', $targetApk)
        if ($DeviceSerial) { $installArgs += @('-DeviceSerial', $DeviceSerial) }
        & $installScript @installArgs
        if ($LASTEXITCODE -ne 0) { throw 'APK installation failed' }
    }
} catch {
    Write-Host ''
    Write-Host "Android APK build failed: $($_.Exception.Message)"
    exit 1
}
