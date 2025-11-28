# Update WIS AI Assistant desktop shortcut icon to Westmead logo

$desktopPath = [System.Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktopPath "WIS AI Assistant.lnk"
$iconPath = "C:\Users\USER\hologramsql-main\build\icon.ico"

Write-Host "🔄 Updating desktop shortcut icon..." -ForegroundColor Cyan

if (Test-Path $shortcutPath) {
    # Load the existing shortcut
    $WScriptShell = New-Object -ComObject WScript.Shell
    $shortcut = $WScriptShell.CreateShortcut($shortcutPath)
    
    # Update the icon
    $shortcut.IconLocation = $iconPath
    
    # Save the shortcut
    $shortcut.Save()
    
    Write-Host "✅ Desktop shortcut icon updated to Westmead logo!" -ForegroundColor Green
    Write-Host "📍 Icon location: $iconPath" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Shortcut not found at: $shortcutPath" -ForegroundColor Yellow
    Write-Host "Creating new shortcut..." -ForegroundColor Cyan
    
    # Create new shortcut
    $WScriptShell = New-Object -ComObject WScript.Shell
    $shortcut = $WScriptShell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = "C:\Users\USER\hologramsql-main\Start WIS AI Assistant.bat"
    $shortcut.WorkingDirectory = "C:\Users\USER\hologramsql-main"
    $shortcut.IconLocation = $iconPath
    $shortcut.Description = "WIS AI Assistant - Westmead Hologram System"
    $shortcut.Save()
    
    Write-Host "✅ New desktop shortcut created with Westmead logo!" -ForegroundColor Green
}

Write-Host "`n📝 Note: If you rebuild the app with 'npm run dist', the icon will be embedded in the .exe file." -ForegroundColor Cyan
