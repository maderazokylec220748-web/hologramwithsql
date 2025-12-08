# Convert PNG to ICO for Windows application icon
Add-Type -AssemblyName System.Drawing

$pngPath = "C:\Users\USER\hologramsql-main\attached_assets\westmead-removebg-preview_1760715284367.png"
$icoPath = "C:\Users\USER\hologramsql-main\build\icon.ico"

Write-Host "Converting Westmead logo to ICO format..." -ForegroundColor Cyan

# Load the PNG image
$img = [System.Drawing.Image]::FromFile($pngPath)

# Create a bitmap from the image
$bitmap = New-Object System.Drawing.Bitmap($img, 256, 256)

# Get the icon handle
$iconHandle = $bitmap.GetHicon()

# Create icon from handle
$icon = [System.Drawing.Icon]::FromHandle($iconHandle)

# Save as ICO file
$fileStream = [System.IO.File]::Create($icoPath)
$icon.Save($fileStream)
$fileStream.Close()

# Cleanup
$icon.Dispose()
$bitmap.Dispose()
$img.Dispose()

Write-Host "✅ Icon created successfully at: $icoPath" -ForegroundColor Green
Write-Host "The Westmead logo is now set as your application icon!" -ForegroundColor Green
