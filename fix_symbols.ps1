$targetDir = "c:\Users\HP\Downloads\PROJEK\BOT MIE AI"
Get-ChildItem -Path $targetDir -Recurse -File -Filter *.js | Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\\.git\\' } | ForEach-Object {
    $path = $_.FullName
    $content = [System.IO.File]::ReadAllText($path)
    $modified = $false
    if ($content.Contains('*[!]*')) {
        $content = $content.Replace('*[!]*', '[!]')
        $modified = $true
    }
    if ($content.Contains('*[i]*')) {
        $content = $content.Replace('*[i]*', '[i]')
        $modified = $true
    }
    if ($content.Contains('*[~]*')) {
        $content = $content.Replace('*[~]*', '[~]')
        $modified = $true
    }
    if ($modified) {
        [System.IO.File]::WriteAllText($path, $content)
        Write-Host "Modified: $path"
    }
}
