[CmdletBinding()]
param(
    [string]$Hostname = "github.com"
)

$ErrorActionPreference = "Stop"

# Exit codes are intentionally stable so Codex sessions can distinguish a
# sandbox/network boundary from an actually invalid credential.
$ExitOk = 0
$ExitNetworkBlocked = 10
$ExitReloginRequired = 11
$ExitUnknown = 12
$ExitGhMissing = 13

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Output "AUTH_GH_MISSING host=$Hostname"
    exit $ExitGhMissing
}

$rawStatus = (& gh auth status --hostname $Hostname --active --json hosts 2>&1 | Out-String).Trim()

try {
    $status = $rawStatus | ConvertFrom-Json
} catch {
    Write-Output "AUTH_UNKNOWN host=$Hostname reason=unparseable-status"
    exit $ExitUnknown
}

$accounts = $status.hosts.$Hostname
$activeAccount = $accounts | Where-Object { $_.active -eq $true } | Select-Object -First 1

if (-not $activeAccount) {
    Write-Output "AUTH_RELOGIN_REQUIRED host=$Hostname reason=no-active-account"
    exit $ExitReloginRequired
}

$login = if ($activeAccount.login) { [string]$activeAccount.login } else { "unknown" }

if ($activeAccount.state -eq "success") {
    Write-Output "AUTH_OK host=$Hostname login=$login"
    exit $ExitOk
}

$failure = [string]$activeAccount.error
$networkPatterns = @(
    "connectex",
    "dial tcp",
    "could not resolve host",
    "forbidden by its access permissions",
    "network is unreachable",
    "connection refused",
    "connection timed out",
    "tls handshake timeout",
    "i/o timeout"
)
$authPatterns = @(
    "bad credentials",
    "http 401",
    "401 unauthorized",
    "token is invalid",
    "token has expired",
    "token was revoked",
    "requires authentication"
)

$normalizedFailure = $failure.ToLowerInvariant()

if ($networkPatterns | Where-Object { $normalizedFailure.Contains($_) }) {
    Write-Output "AUTH_NETWORK_BLOCKED host=$Hostname login=$login action=use-github-app-or-approved-network"
    exit $ExitNetworkBlocked
}

if ($authPatterns | Where-Object { $normalizedFailure.Contains($_) }) {
    Write-Output "AUTH_RELOGIN_REQUIRED host=$Hostname login=$login reason=credential-rejected"
    exit $ExitReloginRequired
}

Write-Output "AUTH_UNKNOWN host=$Hostname login=$login reason=unclassified-gh-error"
exit $ExitUnknown
