<#
.SYNOPSIS
  Daily dev launcher: boots the Android emulator (if needed), then starts the
  Metro dev server and opens the installed dev-client build.

.USAGE
  npm run dev            # boot emulator + start Metro + open Android
  npm run dev -- -Clean  # same, but clear Metro cache first
  npm run dev -- -Avd Pixel_7

.NOTES
  The dev-client APK must already be installed on the emulator (built via EAS:
  `npx eas build -p android --profile development`). Pure JS/TS changes never
  need a rebuild - just edit and Fast Refresh reloads automatically.
#>
param(
  [string]$Avd = "Pixel_5",
  [switch]$Clean
)

$ErrorActionPreference = "Stop"

# --- Resolve the Android SDK ---
$sdk = $env:ANDROID_HOME
if (-not $sdk) { $sdk = $env:ANDROID_SDK_ROOT }
if (-not $sdk) { $sdk = Join-Path $env:LOCALAPPDATA "Android\Sdk" }
$adb      = Join-Path $sdk "platform-tools\adb.exe"
$emulator = Join-Path $sdk "emulator\emulator.exe"

if (-not (Test-Path $adb))      { throw "adb not found at $adb - is ANDROID_HOME set?" }
if (-not (Test-Path $emulator)) { throw "emulator not found at $emulator" }

# --- Boot the emulator if no device is connected ---
$devices = & $adb devices | Select-String "device$"
if (-not $devices) {
  Write-Host "No device connected - booting emulator '$Avd'..." -ForegroundColor Cyan
  Start-Process -FilePath $emulator -ArgumentList "-avd", $Avd, "-no-snapshot-save"

  Write-Host "Waiting for device..." -ForegroundColor Cyan
  & $adb wait-for-device
  while ((& $adb shell getprop sys.boot_completed 2>$null).Trim() -ne "1") {
    Start-Sleep -Seconds 3
  }
  Write-Host "Emulator booted." -ForegroundColor Green
} else {
  Write-Host "Device already connected - skipping emulator boot." -ForegroundColor Green
}

# --- Map Metro's port into the device so the dev client can reach it ---
& $adb reverse tcp:8081 tcp:8081 | Out-Null

# --- Start Metro and auto-open the dev client on Android ---
$expoArgs = @("expo", "start", "--dev-client", "--android")
if ($Clean) { $expoArgs += "-c" }

Write-Host "Starting Metro (dev-client)..." -ForegroundColor Cyan
& npx $expoArgs
