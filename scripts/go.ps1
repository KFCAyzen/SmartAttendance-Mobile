<#
.SYNOPSIS
  Lance Metro en mode Expo Go en forçant la BONNE IP LAN.

  Sur ce PC il y a des cartes réseau virtuelles (Hyper-V / WSL, 172.x) qu'Expo
  annonce parfois à la place du vrai Wi-Fi. Résultat : le projet apparaît une
  seconde dans Expo Go puis disparaît (IP injoignable depuis le téléphone).
  On détecte l'IP réellement utilisée pour sortir du PC (Wi-Fi LAN ou partage
  de connexion iPhone) et on la passe à Metro via REACT_NATIVE_PACKAGER_HOSTNAME.

  Au démarrage, un job de fond PRÉ-CHAUFFE le bundle iOS : le 1er build prend
  ~45 s à cause de React Compiler + Hermes (bundle ~16 Mo), et Expo Go coupe
  avant la fin (« request timeout »). En lançant le build dès que Metro répond,
  le cache est chaud avant la 1re ouverture sur le téléphone.

  ⚠ On ne pré-chauffe QU'UNE plateforme (iOS par défaut). Pré-chauffer Android
  en parallèle sature les workers Metro (~66 s de transform) pile quand le
  téléphone réclame les polices d'icônes (Ionicons.ttf, téléchargées à la volée)
  → « Unable to download asset » et icônes manquantes. Utilise -WarmAndroid pour
  pré-chauffer Android à la place (ex. test sur émulateur).

.USAGE
  npm run go
  npm run go -- -Clean        # vide le cache Metro
  npm run go -- -Tunnel       # passe par un tunnel (si le LAN est bloqué)
  npm run go -- -NoWarmup     # ne pré-chauffe pas le bundle
  npm run go -- -WarmAndroid  # pré-chauffe Android au lieu d'iOS
#>
param(
  [switch]$Clean,
  [switch]$Tunnel,
  [switch]$NoWarmup,
  [switch]$WarmAndroid
)

$ErrorActionPreference = "Stop"

function Get-LanIP {
  # 1) IP source utilisée pour joindre l'extérieur (gère LAN + hotspot iPhone)
  try {
    $r = Find-NetRoute -RemoteIPAddress 8.8.8.8 -ErrorAction Stop |
      Where-Object { $_.IPAddress -and $_.IPAddress -notlike '169.254*' -and $_.IPAddress -ne '127.0.0.1' } |
      Select-Object -First 1 -ExpandProperty IPAddress
    if ($r) { return $r }
  } catch {}

  # 2) Repli : première IPv4 non virtuelle / non link-local
  return (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -notlike '169.254*' -and $_.IPAddress -ne '127.0.0.1' -and
      $_.InterfaceAlias -notmatch 'vEthernet|WSL|Default Switch|Bluetooth|Loopback'
    } |
    Sort-Object InterfaceMetric |
    Select-Object -First 1 -ExpandProperty IPAddress)
}

$ip = Get-LanIP
if ($ip) {
  $env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
  Write-Host "Metro annonce l'IP : $ip" -ForegroundColor Green
} else {
  Write-Host "IP LAN introuvable - Expo choisira tout seul (risque de carte virtuelle)." -ForegroundColor Yellow
}

# Pré-chauffage du bundle : job de fond qui attend que Metro réponde, lit l'URL
# exacte du bundle dans le manifeste (params toujours corrects) et la requête
# pour UNE seule plateforme afin de remplir le cache avant la 1re ouverture.
# On ne pré-chauffe pas les deux : un build Android (~66 s) en parallèle sature
# Metro pile quand le téléphone télécharge les polices d'icônes → icônes KO.
if (-not $NoWarmup -and -not $Tunnel) {
  $warmPlatform = if ($WarmAndroid) { 'android' } else { 'ios' }
  $warmup = Start-Job -ArgumentList $warmPlatform -ScriptBlock {
    param($platform)
    $base = "http://localhost:8081"
    # 1) Attendre que le packager soit prêt (max ~60 s)
    for ($i = 0; $i -lt 60; $i++) {
      try {
        if ((Invoke-WebRequest -Uri "$base/status" -UseBasicParsing -TimeoutSec 3).Content -match 'running') { break }
      } catch {}
      Start-Sleep -Seconds 1
    }
    try {
      # 2) Récupérer l'URL du bundle depuis le manifeste pour cette plateforme
      $manifest = Invoke-RestMethod -Uri "$base/" -Headers @{ 'expo-platform' = $platform; 'Accept' = 'application/expo+json,application/json' } -TimeoutSec 30
      $url = $manifest.launchAsset.url
      if ($url) {
        $url = $url -replace 'https?://[^/]+', $base   # forcer localhost (build local rapide)
        # 3) Construire le bundle (peut prendre ~45 s à froid)
        Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 300 | Out-Null
      }
    } catch {}
  }
  Write-Host "Pre-chauffage du bundle $warmPlatform lance en arriere-plan..." -ForegroundColor Cyan
}

$expoArgs = @("expo", "start", "--go")
if ($Tunnel) { $expoArgs += "--tunnel" }
if ($Clean)  { $expoArgs += "-c" }

try {
  & npx $expoArgs
} finally {
  if ($warmup) { Stop-Job $warmup -ErrorAction SilentlyContinue; Remove-Job $warmup -Force -ErrorAction SilentlyContinue }
}
