$ErrorActionPreference = 'Stop'

$androidDir = $PSScriptRoot
$repoRoot = (Resolve-Path (Join-Path $androidDir '..\..')).Path
$keystorePath = Join-Path $env:LOCALAPPDATA 'HappyGreens\Signing\storefront-release-2026.jks'
$javaRoot = Join-Path $env:LOCALAPPDATA 'HappyGreens\Java'
$javaHome = Get-ChildItem -LiteralPath $javaRoot -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '^jdk-21' -and (Test-Path -LiteralPath (Join-Path $_.FullName 'bin\java.exe')) } |
    Sort-Object Name -Descending |
    Select-Object -First 1 -ExpandProperty FullName
if (-not $javaHome) {
    throw "Java 21 JDK was not found under $javaRoot. Install or extract a JDK 21 there, then retry."
}
$androidSdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$gradleHome = Join-Path $env:TEMP 'HappyGreens-Gradle'
$androidUserHome = Join-Path $env:TEMP 'HappyGreens-Android'
$signedApk = Join-Path $androidDir 'app\build\outputs\apk\release\app-release.apk'
$apksigner = Join-Path $androidSdk 'build-tools\36.0.0\apksigner.bat'
$destination = Join-Path $repoRoot 'Happy-Greens-Storefront.apk'

foreach ($path in @($keystorePath, $javaHome, $androidSdk, $apksigner)) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Required release build file or tool was not found: $path"
    }
}

$storeSecure = Read-Host 'Enter the existing storefront keystore password (input is hidden)' -AsSecureString
$keySecure = Read-Host 'Enter the existing storefront key password (input is hidden)' -AsSecureString
$storePointer = [IntPtr]::Zero
$keyPointer = [IntPtr]::Zero

try {
    $storePointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($storeSecure)
    $keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($keySecure)
    $env:JAVA_HOME = $javaHome
    $env:ANDROID_HOME = $androidSdk
    $env:ANDROID_SDK_ROOT = $androidSdk
    $env:ANDROID_USER_HOME = $androidUserHome
    $env:GRADLE_USER_HOME = $gradleHome
    $env:HAPPY_GREENS_RELEASE_KEYSTORE = $keystorePath
    $env:HAPPY_GREENS_RELEASE_STORE_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($storePointer)
    $env:HAPPY_GREENS_RELEASE_KEY_ALIAS = 'happy-greens-storefront'
    $env:HAPPY_GREENS_RELEASE_KEY_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer)

    Push-Location $androidDir
    try {
        & .\gradlew.bat --no-daemon assembleRelease
        if ($LASTEXITCODE -ne 0) {
            throw "Gradle release build failed with exit code $LASTEXITCODE."
        }
    } finally {
        Pop-Location
    }

    if (-not (Test-Path -LiteralPath $signedApk)) {
        throw "Gradle did not produce the signed release APK: $signedApk"
    }

    $certificateInfo = (& $apksigner verify --print-certs $signedApk 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) {
        throw "APK signature verification failed: $certificateInfo"
    }
    $sha1 = ($certificateInfo | Select-String -Pattern 'SHA-1 digest:\s*([0-9a-fA-F:]+)').Matches.Groups[1].Value -replace ':', ''
    if ($sha1.ToLowerInvariant() -ne '6e5726eb304604ade5021d0f57464b82146d5d3d') {
        throw "The APK was signed with a different key than the Google Android OAuth client. Detected SHA-1: $sha1"
    }

    Copy-Item -LiteralPath $signedApk -Destination $destination -Force
    Get-Item -LiteralPath $destination | Select-Object FullName, Length, LastWriteTime
    Write-Output 'APK signature verified against the storefront Android OAuth SHA-1.'
} finally {
    Remove-Item Env:HAPPY_GREENS_RELEASE_KEYSTORE -ErrorAction SilentlyContinue
    Remove-Item Env:HAPPY_GREENS_RELEASE_STORE_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:HAPPY_GREENS_RELEASE_KEY_ALIAS -ErrorAction SilentlyContinue
    Remove-Item Env:HAPPY_GREENS_RELEASE_KEY_PASSWORD -ErrorAction SilentlyContinue
    if ($storePointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($storePointer) }
    if ($keyPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer) }
    if ($storeSecure) { $storeSecure.Dispose() }
    if ($keySecure) { $keySecure.Dispose() }
}
