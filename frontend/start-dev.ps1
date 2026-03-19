$ErrorActionPreference = "Stop"

$frontendDir = $PSScriptRoot
$rootDir = Split-Path $frontendDir -Parent
$backendDir = Join-Path $rootDir "backend"
$backendScript = Join-Path $backendDir "app.py"
$venvPython = Join-Path $backendDir "myenv1\Scripts\python.exe"
$venvConfig = Join-Path $backendDir "myenv1\pyvenv.cfg"
$backendVenvConfig = Join-Path $backendDir "pyvenv.cfg"
$reactScripts = Join-Path $frontendDir "node_modules\.bin\react-scripts.cmd"
$backendHealthUrl = if ($env:BTDS_BACKEND_HEALTH_URL) { $env:BTDS_BACKEND_HEALTH_URL } else { "http://127.0.0.1:5000/health" }
$backendProcess = $null
$backendStdoutLog = Join-Path $env:TEMP "btds-backend-stdout.log"
$backendStderrLog = Join-Path $env:TEMP "btds-backend-stderr.log"

function Is-WindowsAppsShimPath {
  param([string]$PathValue)

  if (-not $PathValue) {
    return $false
  }

  return $PathValue -like "*\AppData\Local\Microsoft\WindowsApps\*"
}

function Is-CommandName {
  param([string]$Value)

  if (-not $Value) {
    return $false
  }

  return -not ($Value -match "[\\/]" -or $Value -like "*.exe")
}

function ConvertTo-CmdArgumentString {
  param([string[]]$Parts)

  $escapedParts = foreach ($part in $Parts) {
    '"' + ($part -replace '"', '\"') + '"'
  }

  return ($escapedParts -join " ")
}

function New-CmdCommandLine {
  param(
    [string]$Command,
    [string[]]$Arguments = @()
  )

  if (-not $Arguments -or $Arguments.Count -eq 0) {
    return $Command
  }

  return ($Command + " " + (ConvertTo-CmdArgumentString $Arguments))
}

function Get-PyVenvExecutableCandidates {
  param([string[]]$ConfigPaths)

  $candidates = @()

  foreach ($configPath in $ConfigPaths) {
    if (-not (Test-Path $configPath)) {
      continue
    }

    foreach ($line in Get-Content $configPath) {
      if ($line -match "^\s*(home|executable)\s*=\s*(.+?)\s*$") {
        $value = $matches[2].Trim()
        if ($matches[1] -eq "home") {
          $value = Join-Path $value "python.exe"
        }
        $candidates += $value
      }
    }
  }

  return $candidates
}

function Get-PythonCandidates {
  $seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
  $candidates = [System.Collections.Generic.List[string]]::new()

  function Add-Candidate {
    param([string]$PathValue)

    if (-not $PathValue) {
      return
    }

    $normalized = $PathValue.Trim('"')
    if ([string]::IsNullOrWhiteSpace($normalized)) {
      return
    }

    if ($seen.Add($normalized)) {
      $candidates.Add($normalized) | Out-Null
    }
  }

  Add-Candidate $env:BACKEND_PYTHON
  Add-Candidate $venvPython

  foreach ($candidate in Get-PyVenvExecutableCandidates -ConfigPaths @($venvConfig, $backendVenvConfig)) {
    Add-Candidate $candidate
  }

  $localAppData = $env:LOCALAPPDATA
  $userProfile = $env:USERPROFILE
  $programFiles = ${env:ProgramFiles}
  $programFilesX86 = ${env:ProgramFiles(x86)}

  foreach ($candidate in @(
    (Join-Path $localAppData "Programs\Python\Python312\python.exe"),
    (Join-Path $localAppData "Programs\Python\Python311\python.exe"),
    (Join-Path $localAppData "Programs\Python\Python310\python.exe"),
    (Join-Path $userProfile "AppData\Local\Programs\Python\Python312\python.exe"),
    (Join-Path $userProfile "AppData\Local\Programs\Python\Python311\python.exe"),
    (Join-Path $userProfile "AppData\Local\Programs\Python\Python310\python.exe"),
    (Join-Path $programFiles "Python312\python.exe"),
    (Join-Path $programFiles "Python311\python.exe"),
    (Join-Path $programFiles "Python310\python.exe"),
    (Join-Path $programFilesX86 "Python312\python.exe"),
    (Join-Path $programFilesX86 "Python311\python.exe"),
    (Join-Path $programFilesX86 "Python310\python.exe"),
    "python",
    "py"
  )) {
    Add-Candidate $candidate
  }

  return $candidates
}

function Test-PythonCommand {
  param(
    [string]$Command,
    [string[]]$Arguments = @()
  )

  if (-not $Command) {
    return $false
  }

  if (($Command -match "[\\/]" -or $Command -like "*.exe") -and -not (Test-Path $Command)) {
    return $false
  }

  if (Is-CommandName $Command) {
    return $Command -in @("python", "py")
  }

  if (Is-WindowsAppsShimPath $Command) {
    return $false
  }

  try {
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    if (Is-CommandName $Command) {
      $startInfo.FileName = "cmd.exe"
      $startInfo.Arguments = "/d /s /c " + (New-CmdCommandLine -Command $Command -Arguments ($Arguments + @("-c", "import sys")))
    } else {
      $startInfo.FileName = $Command
      $startInfo.Arguments = (($Arguments + @("-c", "import sys")) -join " ")
    }
    $startInfo.WorkingDirectory = $backendDir
    $startInfo.UseShellExecute = $false
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true

    $process = [System.Diagnostics.Process]::Start($startInfo)
    if (-not $process.WaitForExit(5000)) {
      $process.Kill()
      return $false
    }

    return $process.ExitCode -eq 0
  } catch {
    return $false
  }
}

function Resolve-PythonCommand {
  foreach ($candidate in Get-PythonCandidates) {
    if ($candidate -eq "py" -and (Test-PythonCommand -Command "py")) {
      return @{
        Command = "py"
        Arguments = @("-3")
      }
    }

    if (Test-PythonCommand -Command $candidate) {
      return @{
        Command = $candidate
        Arguments = @()
      }
    }
  }

  throw "Unable to start Flask backend: no working Python interpreter was found. The copied venv points to an unusable WindowsApps Python stub. Install a real Python interpreter or set BACKEND_PYTHON to a valid python.exe."
}

function Wait-ForBackend {
  param(
    [string]$Url,
    [System.Diagnostics.Process]$Process,
    [int]$TimeoutSeconds = 180
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if ($Process -and $Process.HasExited) {
      throw "Backend process exited before becoming healthy."
    }

    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -lt 500) {
        return
      }
    } catch {
    }
    Start-Sleep -Seconds 1
  }

  throw "Timed out waiting for backend at $Url."
}

function Write-BackendLogs {
  foreach ($logPath in @($backendStdoutLog, $backendStderrLog)) {
    if (Test-Path $logPath) {
      Write-Host ""
      Write-Host ("Backend log: " + $logPath)
      Get-Content $logPath -Tail 60
    }
  }
}

try {
  $python = Resolve-PythonCommand

  $env:TF_CPP_MIN_LOG_LEVEL = if ($env:TF_CPP_MIN_LOG_LEVEL) { $env:TF_CPP_MIN_LOG_LEVEL } else { "2" }
  $env:TF_ENABLE_ONEDNN_OPTS = if ($env:TF_ENABLE_ONEDNN_OPTS) { $env:TF_ENABLE_ONEDNN_OPTS } else { "0" }
  $env:BROWSERSLIST_IGNORE_OLD_DATA = "true"

  Remove-Item $backendStdoutLog, $backendStderrLog -ErrorAction SilentlyContinue

  $backendArgs = @($python.Arguments + @($backendScript))
  if (Is-CommandName $python.Command) {
    $backendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList @("/d", "/s", "/c", (New-CmdCommandLine -Command $python.Command -Arguments $backendArgs)) -WorkingDirectory $backendDir -RedirectStandardOutput $backendStdoutLog -RedirectStandardError $backendStderrLog -PassThru
  } else {
    $backendProcess = Start-Process -FilePath $python.Command -ArgumentList $backendArgs -WorkingDirectory $backendDir -RedirectStandardOutput $backendStdoutLog -RedirectStandardError $backendStderrLog -PassThru
  }

  Wait-ForBackend -Url $backendHealthUrl -Process $backendProcess

  if (-not (Test-Path $reactScripts)) {
    throw "react-scripts was not found. Run npm install in the frontend directory."
  }

  & $reactScripts start
  $exitCode = $LASTEXITCODE
  if ($null -ne $exitCode -and $exitCode -ne 0) {
    exit $exitCode
  }
} catch {
  Write-BackendLogs
  throw
} finally {
  if ($backendProcess -and -not $backendProcess.HasExited) {
    Stop-Process -Id $backendProcess.Id -Force
  }
}
