# Ollama Setup Guide - Offline AI for School Kiosk

This guide walks you through setting up Ollama with Llama 3.2:3b for completely offline, text-only AI on your school kiosk.

## What is Ollama?

Ollama is a lightweight framework for running large language models locally. This means:
- ✅ **Completely Offline** - No internet required after model is downloaded
- ✅ **Full Privacy** - All conversations stay on your machine/kiosk
- ✅ **Unlimited Usage** - No API rate limits, hardware-limited only
- ✅ **No Costs** - No API subscriptions needed
- ✅ **Text-Only** - Perfect for public kiosk use
- ✅ **Fast** - Instant responses with no network latency

## System Requirements

### Minimum (3B Model - Recommended for Kiosk)
- **RAM**: 4GB (8GB recommended for smoother operation)
- **Storage**: 5GB free space (for model + OS)
- **CPU**: Any modern processor (Intel/AMD)
- **GPU** (optional): NVIDIA, AMD, or Apple Silicon for acceleration

### Medium (7B Model - More Capable)
- **RAM**: 8GB minimum
- **Storage**: 10GB free space
- **CPU**: Modern multi-core processor

## Installation

### Windows

#### Option 1: Installer (Recommended)
1. Download Ollama from [ollama.ai](https://ollama.ai)
2. Run the Windows installer
3. It will install to `C:\Users\{YourUsername}\AppData\Local\Programs\Ollama`
4. Ollama will start automatically

#### Option 2: Using PowerShell (Advanced)
```powershell
# Run as Administrator
cd "c:\Users\Bhojo\Downloads\hologramwithsql-main\hologramwithsql-main"
.\scripts\setup-ollama.ps1
```

### macOS
```bash
# Download and install
curl -L https://ollama.ai/download/Ollama-darwin.zip -o Ollama.zip
unzip Ollama.zip
mv Ollama.app /Applications/
open /Applications/Ollama.app
```

### Linux
```bash
# Ubuntu/Debian
curl https://ollama.ai/install.sh | sh

# Or for other distributions, download from https://ollama.ai
```

## Starting Ollama

### Windows
Ollama runs as a background service automatically. To verify it's running:
```powershell
# Test if Ollama is responding
Invoke-WebRequest http://localhost:11434/api/tags
```

If it fails, you can start it manually:
```bash
ollama serve
```

### macOS/Linux
```bash
# Start Ollama in foreground (recommended for first time)
ollama serve

# Or run as background service
nohup ollama serve &
```

## Download the Model

Once Ollama is running, download the Llama 3.2:3b model:

```bash
# Download Llama 3.2:3b (recommended for kiosk)
ollama pull llama2:3b

# Alternative models to try:
ollama pull neural-chat:7b      # More capable (4.7GB)
ollama pull orca-mini:3b        # Even faster (1.9GB)
ollama pull mistral              # Good alternative
```

**Download times:**
- llama2:3b: ~3 minutes (on fast connection)
- neural-chat:7b: ~8 minutes
- orca-mini:3b: ~2 minutes

### Check Downloaded Models
```bash
ollama list
```

You should see output like:
```
NAME                  ID              SIZE      MODIFIED
llama2:3b             6fefb2405e94    3.5GB     2 hours ago
```

## Configuration

### 1. Update Environment Variables
Edit `.env` file in the project root:

```dotenv
# Ollama configuration
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama2:3b
```

### 2. Alternative Model Selection
Update `OLLAMA_MODEL` in `.env` if using a different model:

```dotenv
# Faster option (if RAM is limited)
OLLAMA_MODEL=orca-mini:3b

# More capable option (if you have 8GB+ RAM)
OLLAMA_MODEL=neural-chat:7b
```

### 3. For Remote Ollama Instances
If running Ollama on a different machine:

```dotenv
# Example: Ollama server on another computer
OLLAMA_API_URL=http://192.168.1.100:11434
```

## Starting the Application

### Development Mode

**Terminal 1 - Start Ollama:**
```bash
ollama serve
```

**Terminal 2 - Start the Application:**
```bash
npm run dev
```

The kiosk will be available at `http://localhost:5173`

### Production Mode

**Terminal 1 - Start Ollama:**
```bash
ollama serve
```

**Terminal 2 - Build and Start:**
```bash
npm run build
npm start
```

## Verification

### Check Ollama Health
```bash
# Should return model list
curl http://localhost:11434/api/tags

# Test chat endpoint (should get a response)
curl -X POST http://localhost:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2:3b",
    "messages": [{"role": "user", "content": "Hi"}],
    "stream": false
  }'
```

### Check Application
1. Navigate to `http://localhost:5001` (or configured port)
2. You should see the kiosk interface
3. Try asking a question about the school
4. Response should come from local Ollama (check timestamp - should be instant)

## Troubleshooting

### Ollama Not Running
**Error**: `connect ECONNREFUSED 127.0.0.1:11434`

**Solution**:
```bash
# Windows - Check if service is running
Get-Service | where Name -like "*ollama*"

# macOS - Check if app is running
ps aux | grep ollama

# Start it:
ollama serve
```

### Model Not Found
**Error**: `Model "llama2:3b" not found`

**Solution**:
```bash
# Pull the model
ollama pull llama2:3b

# Or update OLLAMA_MODEL in .env to match installed model
ollama list  # Shows all available models
```

### Out of Memory
**Error**: `allocate memory` or system freezing

**Solution**:
1. Close other applications to free RAM
2. Switch to smaller model:
   ```bash
   ollama pull orca-mini:3b
   # Update OLLAMA_MODEL=orca-mini:3b in .env
   ```
3. Allocate more RAM to Ollama (see performance tuning below)

### Slow Responses
**Solution**:
1. Close other applications
2. Try a smaller model (orca-mini:3b)
3. Add GPU acceleration (see below)

## Performance Tuning

### Enable GPU Acceleration

#### NVIDIA GPU (CUDA)
```bash
# Install CUDA Toolkit from https://developer.nvidia.com/cuda-toolkit
# Then restart Ollama - it will auto-detect CUDA
```

#### AMD GPU (ROCm)
```bash
# Linux only - install ROCm
# Windows: Use WSL2 with ROCm
```

#### Apple Silicon (Mac)
Automatically supported - no configuration needed!

### Adjust CPU Cores
Default: Uses all available CPU cores
To limit (e.g., for other services):
```bash
# Use 4 cores instead of all
OLLAMA_NUM_THREAD=4 ollama serve
```

### Keep Model in Memory
By default, model is unloaded after 5 minutes of inactivity:
```bash
# Keep model in memory indefinitely
OLLAMA_KEEP_ALIVE=-1 ollama serve

# Keep for 30 minutes (1800 seconds)
OLLAMA_KEEP_ALIVE=1800 ollama serve
```

## Privacy Compliance

✅ **COPPA Compliant** (Children's Online Privacy Protection Act)
- No data collection or analytics
- No cookies or tracking
- No external requests

✅ **GDPR Compliant**
- Data retention policies configurable
- All conversations deleted based on retention settings
- No data sent to external servers

✅ **FERPA Compliant** (Family Educational Rights and Privacy Act)
- No student data shared
- Isolated system with no external connections
- Local database only

## Production Deployment

### Systemd Service (Linux)
Create `/etc/systemd/system/ollama.service`:
```ini
[Unit]
Description=Ollama AI Service
After=network-online.target

[Service]
Type=simple
User=ollama
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ollama
sudo systemctl start ollama
```

### Docker (Optional)
```dockerfile
FROM ubuntu:22.04
RUN curl https://ollama.ai/install.sh | sh
RUN ollama pull llama2:3b
EXPOSE 11434
CMD ["ollama", "serve"]
```

## Monitoring

### Check Model Status
```bash
# See which models are loaded in memory
ollama ps
```

### View Logs
```bash
# macOS
log show --predicate 'process == "Ollama"' --level debug

# Linux
journalctl -u ollama -f

# Windows
# Check C:\Users\{Username}\AppData\Local\Ollama\logs
```

## Model Comparison for School Kiosk

| Model | Size | Speed | Quality | RAM | Use Case |
|-------|------|-------|---------|-----|----------|
| orca-mini:3b | 1.9GB | ⚡⚡⚡ | ⭐⭐ | 2GB | Ultra-fast, limited response quality |
| llama2:3b | 3.5GB | ⚡⚡ | ⭐⭐⭐ | 4GB | **RECOMMENDED** - Best balance |
| neural-chat:7b | 4.7GB | ⚡ | ⭐⭐⭐⭐ | 8GB | Slower but more capable |
| mistral:latest | 3.8GB | ⚡⚡ | ⭐⭐⭐ | 4GB | Good alternative to Llama |

**Recommendation for School Kiosk**: `llama2:3b` - Good balance of speed, response quality, and resource usage.

## Support & Resources

- **Ollama Website**: https://ollama.ai
- **Model Library**: https://ollama.ai/library
- **GitHub**: https://github.com/ollama/ollama
- **Discord Community**: https://discord.gg/ollama

## Next Steps

1. ✅ Install Ollama
2. ✅ Download model: `ollama pull llama2:3b`
3. ✅ Update `.env` with model configuration
4. ✅ Start `ollama serve`
5. ✅ Run `npm run dev`
6. ✅ Test at `http://localhost:5001`

For questions or issues, check the troubleshooting section above.
