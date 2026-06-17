$ErrorActionPreference = 'Stop'

$repoDir = $PSScriptRoot
$appDir = Join-Path $repoDir 'desktop'
$serverUrl = 'http://localhost:4200/dist/'
$serverLog = Join-Path $env:TEMP 'idai-field-ng-serve-ko.log'

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

function Wait-ForEnter {
    Read-Host 'Press Enter to close'
}

function Test-FieldServer {
    try {
        $response = Invoke-WebRequest -Uri $serverUrl -UseBasicParsing -TimeoutSec 5
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Stop-ProcessTree {
    param([System.Diagnostics.Process] $Process)

    if ($Process -and -not $Process.HasExited) {
        & taskkill.exe /PID $Process.Id /T /F | Out-Null
    }
}

$serverProcess = $null
$startedServer = $false

try {
    $nodeDir = Resolve-NodeDir

    if (-not (Test-Path -LiteralPath (Join-Path $appDir 'package.json'))) {
        throw "Desktop package was not found: $appDir"
    }

    $electronExe = Join-Path $appDir 'node_modules\electron\dist\electron.exe'
    if (-not (Test-Path -LiteralPath $electronExe)) {
        throw "Electron runtime was not found: $electronExe"
    }

    $env:Path = "$nodeDir;$env:Path"
    Set-Location -LiteralPath $appDir

    Write-Host 'Starting iDAI Field in Korean.'

    if (Test-FieldServer) {
        Write-Host 'Development server is already ready.'
    } else {
        Remove-Item -LiteralPath $serverLog -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath (Join-Path $appDir '.angular\cache') -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host 'Building the Korean development bundle. The first run can take 1-3 minutes.'
        Write-Host 'If Angular appears to pause at "Generating browser application bundles", keep waiting.'

        $command = "/c npm run ng:serve:ko > `"$serverLog`" 2>&1"
        $serverProcess = Start-Process -FilePath 'cmd.exe' `
            -ArgumentList $command `
            -WorkingDirectory $appDir `
            -WindowStyle Hidden `
            -PassThru
        $startedServer = $true

        $deadline = (Get-Date).AddMinutes(10)
        while (-not (Test-FieldServer)) {
            if ($serverProcess.HasExited) {
                Write-Host ''
                if (Test-Path -LiteralPath $serverLog) {
                    Get-Content -LiteralPath $serverLog -Tail 80
                }
                throw 'Angular development server exited before it was ready.'
            }

            if ((Get-Date) -gt $deadline) {
                Write-Host ''
                if (Test-Path -LiteralPath $serverLog) {
                    Get-Content -LiteralPath $serverLog -Tail 80
                }
                throw 'Timed out while waiting for the Angular development server.'
            }

            Write-Host -NoNewline '.'
            Start-Sleep -Seconds 5
        }

        Write-Host ''
        Write-Host 'Development server is ready.'
    }

    Write-Host 'Opening the app window.'
    $electronProcess = Start-Process -FilePath $electronExe `
        -ArgumentList '.', 'dev' `
        -WorkingDirectory $appDir `
        -PassThru

    Wait-Process -Id $electronProcess.Id
} catch {
    Write-Host ''
    Write-Host "Startup failed: $($_.Exception.Message)"
    Wait-ForEnter
    exit 1
} finally {
    if ($startedServer) {
        Stop-ProcessTree -Process $serverProcess
    }
}
