$lines = netstat -ano | Select-String ':5000'
if ($lines) {
  foreach ($l in $lines) {
    $text = $l.ToString().Trim()
    if ($text -match '(\\d+)$') {
      $killPid = $matches[1]
      Write-Output "Killing $killPid"
      try {
        taskkill /PID $killPid /F | Out-Null
        Write-Output "Killed $killPid"
      } catch {
        Write-Output ("Failed to kill " + $killPid + ": " + $_)
      }
    } else {
      Write-Output "Could not parse PID from: $text"
    }
  }
} else {
  Write-Output 'No process using port 5000'
}
