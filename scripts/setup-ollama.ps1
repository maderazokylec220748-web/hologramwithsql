# Ollama Setup Script for Windows
# This script automates Ollama installation and model download for the school kiosk

param(
    [string]$Model = "llama2:3b",
    [switch]$SkipOllamaInstall = $false,
    [switch]$SkipModelDownload = $false
)

function Write-Info {
    Write-Host "ℹ️  $args" -ForegroundColor Cyan
}

function Write-Success {
    Write-Host "✅ $args" -ForegroundColor Green
}

function Write-Warning {
    Write-Host "⚠️  $args" -ForegroundColor Yellow
}

function Write-Error {
    Write-Host "❌ $args" -ForegroundColor Red
}

# Check if running as admin
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Warning "This script requires administrator privileges for Ollama installation."
    Write-Info "Attempting to elevate privileges..."
    
    $ScriptPath = $MyInvocation.MyCommand.Path
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`"" -Verb RunAs
    exit
}

Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║   Ollama Setup for WIS AI School Kiosk           ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# Step 1: Check for Ollama Installation
Write-Info "Step 1: Checking for Ollama..."
$OllamaPath = "C:\Users\$env:USERNAME\AppData\Local\Programs\Ollama\ollama.exe"

if (Test-Path $OllamaPath) {
    Write-Success "Ollama is already installed at $OllamaPath"
} elseif (-not $SkipOllamaInstall) {
    Write-Info "Ollama not found. Downloading installer..."
    
    try {
        $DownloadUrl = "https://ollama.ai/download/OllamaSetup.exe"
        $InstallerPath = "$env:TEMP\OllamaSetup.exe"
        
        Write-Info "Downloading from $DownloadUrl..."
        Invoke-WebRequest -Uri $DownloadUrl -OutFile $InstallerPath -ErrorAction Stop
        
        Write-Success "Download complete. Running installer..."
        Start-Process $InstallerPath -Wait
        
        # Wait for installation and service to start
        Write-Info "Waiting for Ollama service to start (30 seconds)..."
        Start-Sleep -Seconds 30
        
        Write-Success "Ollama installation complete!"
    } catch {
        Write-Error "Failed to download/install Ollama: $_"
        Write-Info "Please download manually from https://ollama.ai and try again."
        exit 1
    }
} else {
    Write-Warning "Ollama installation skipped. Please install manually from https://ollama.ai"
}

# Step 2: Wait for Ollama Service
Write-Info ""
Write-Info "Step 2: Verifying Ollama service..."

$maxAttempts = 10
$attempt = 0

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 5 -ErrorAction Stop
        Write-Success "Ollama is running and responding on port 11434"
        break
    } catch {
        $attempt++
        if ($attempt -lt $maxAttempts) {
            Write-Info "Waiting for Ollama to start... (attempt $attempt/$maxAttempts)"
            Start-Sleep -Seconds 3
        } else {
            Write-Error "Ollama is not responding after $maxAttempts attempts."
            Write-Warning "Please ensure Ollama is running by:"
            Write-Info "  1. Opening Ollama application from Start Menu"
            Write-Info "  2. Or running: ollama serve"
            exit 1
        }
    }
}

# Step 3: Download Model
if (-not $SkipModelDownload) {
    Write-Info ""
    Write-Info "Step 3: Downloading model '$Model'..."
    Write-Warning "First time download may take several minutes depending on internet speed."
    
    try {
        # Use Invoke-WebRequest to call the Ollama API
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/pull" `
            -Method POST `
            -Headers @{"Content-Type" = "application/json"} `
            -Body (@{name = $Model; stream = $false} | ConvertTo-Json) `
            -TimeoutSec 600 `
            -ErrorAction Stop
        
        Write-Success "Model '$Model' downloaded successfully!"
        
    } catch {
        Write-Error "Failed to download model: $_"
        Write-Info "Try manually downloading with:"
        Write-Info "  ollama pull $Model"
        exit 1
    }
}

# Step 4: Verify Model
Write-Info ""
Write-Info "Step 4: Verifying installed models..."

try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -ErrorAction Stop
    $models = ($response.Content | ConvertFrom-Json).models
    
    if ($models.Count -gt 0) {
        Write-Success "Available models:"
        $models | ForEach-Object {
            Write-Host "  • $($_.name)" -ForegroundColor Green
        }
    } else {
        Write-Warning "No models found. Please run: ollama pull $Model"
    }
} catch {
    Write-Error "Could not retrieve model list: $_"
}

# Step 5: Configuration
Write-Info ""
Write-Info "Step 5: Configuration recommendations..."
Write-Info ""
Write-Info "Add these to your .env file:"
Write-Host "  OLLAMA_API_URL=http://localhost:11434" -ForegroundColor Yellow
Write-Host "  OLLAMA_MODEL=$Model" -ForegroundColor Yellow

# Step 6: Test Chat
Write-Info ""
Write-Info "Step 6: Testing Ollama chat..."

try {
    $testMessage = @{
        model = $Model
        messages = @(
            @{role = "user"; content = "Hello! What is your name?"}
        )
        stream = $false
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/chat" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $testMessage `
        -TimeoutSec 120 `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    $answer = $result.message.content
    
    Write-Success "Ollama is working! Sample response:"
    Write-Host "  $answer" -ForegroundColor Cyan
    
} catch {
    Write-Warning "Chat test failed (model may still be loading): $_"
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   Setup Complete! Ready to start the kiosk        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Info "Next steps:"
Write-Host "  1. Make sure Ollama is running (should auto-start)" -ForegroundColor White
Write-Host "  2. Update .env with configuration (see above)" -ForegroundColor White
Write-Host "  3. Run: npm run dev" -ForegroundColor White
Write-Host "  4. Open: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Info "Documentation: See OLLAMA_SETUP.md for detailed information"
Write-Info ""
