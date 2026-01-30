# Text-Only AI Kiosk Deployment Guide

## System Overview

This is a **text-only, offline-capable AI system** built for school kiosks using:
- **Ollama** - Local, offline AI engine
- **Llama 3.2:3b** - Lightweight LLM (3GB)
- **Zero external API calls** - Complete privacy
- **Unlimited usage** - Hardware-limited only
- **No subscriptions** - Free to run indefinitely

## Architecture

```
┌─────────────────────────────────────────┐
│         Web Kiosk Interface             │
│      (Text Input/Output Only)           │
├─────────────────────────────────────────┤
│    Backend API (Node.js + Express)      │
│  - Rate limiting                        │
│  - Session management                   │
│  - Query logging & analytics            │
├─────────────────────────────────────────┤
│   Ollama Integration Layer               │
│  - HTTP REST API                        │
│  - Automatic model loading              │
│  - Error handling & retry logic         │
├─────────────────────────────────────────┤
│     Local Ollama Service                │
│  - Llama 3.2:3b model (3GB)            │
│  - GPU acceleration (optional)          │
│  - Running on localhost:11434           │
├─────────────────────────────────────────┤
│      MySQL Database (Optional)          │
│  - Query history                        │
│  - User feedback                        │
│  - Analytics (privacy-respecting)       │
└─────────────────────────────────────────┘
```

## Quick Start

### 1. Install Ollama

**Windows:**
1. Download from https://ollama.ai
2. Run installer (installs as background service)
3. Restart computer

**macOS:**
1. Download from https://ollama.ai
2. Open `Ollama.app`

**Linux:**
```bash
curl https://ollama.ai/install.sh | sh
```

### 2. Download Model

```bash
ollama pull llama2:3b
```

### 3. Configure Application

Create `.env` file:
```dotenv
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama2:3b
PORT=5001
NODE_ENV=production
DATABASE_URL=mysql://root@localhost:3306/hologram
```

### 4. Start Services

**Terminal 1 - Start Ollama:**
```bash
ollama serve
```

**Terminal 2 - Start Kiosk:**
```bash
npm install
npm run build
npm start
```

Access at: `http://localhost:5001`

## Deployment Models

### Model 1: Single Kiosk (Recommended for Most Schools)
- One Windows/Linux computer with Ollama + Kiosk app
- **Hardware**: 4GB RAM, 10GB storage minimum
- **Cost**: $0 (after initial hardware)
- **Maintenance**: Low (no subscriptions, no API monitoring)

### Model 2: Multi-Kiosk Setup (Large Schools)
- Separate Ollama server + multiple kiosk clients
- **Ollama Server**: 8GB RAM, GPU recommended
- **Kiosk Clients**: Can be lower-spec machines
- **Network**: Local network connection required

```
┌─────────────────┐    ┌──────────────┐
│   Kiosk #1      │    │   Kiosk #2   │
│  (Browser UI)   │    │  (Browser UI)│
└────────┬────────┘    └──────┬───────┘
         │                     │
         └──────────┬──────────┘
                    │
           ┌────────▼────────┐
           │ Shared Ollama   │
           │ Server (Remote) │
           └─────────────────┘
```

**Configure remote Ollama:**
```dotenv
OLLAMA_API_URL=http://192.168.1.100:11434
OLLAMA_MODEL=llama2:3b
```

### Model 3: Fully Offline (No Network)
- Kiosk runs completely offline
- Database stored locally (SQLite instead of MySQL)
- No internet connection needed after setup

## Hardware Recommendations

| Component | Minimum | Recommended | High-End |
|-----------|---------|-------------|----------|
| CPU | Intel i5 / AMD Ryzen 3 | i7 / Ryzen 5 | i9 / Ryzen 7 |
| RAM | 4GB | 8GB | 16GB |
| Storage | 10GB SSD | 20GB SSD | 50GB SSD |
| GPU | None | NVIDIA GTX 1650 | NVIDIA RTX 3070+ |
| Network | Optional | Optional | N/A |

**Cost Estimate:**
- Kiosk PC: $300-500 (used)
- Monitor: $100-300
- Keyboard/Mouse: $30-100
- **Total**: $430-900 per kiosk (one-time)
- **Monthly cost**: $0

## Privacy & Compliance

### ✅ COPPA Compliant
- No data collection or tracking
- No third-party cookies
- No external service integrations
- Designed for children's safety

### ✅ FERPA Compliant
- No student records collected
- No personally identifiable information
- Data retention: Configurable (default 7 days)

### ✅ GDPR Compliant
- Right to deletion: Built-in
- Data minimization: Only essential data stored
- Transparency: All data locally stored
- No data transfers: Everything stays on-premise

### Data Retention Policy
```dotenv
# How long to keep sensitive data
QUERY_RETENTION_DAYS=7       # User questions
CHAT_RETENTION_DAYS=7        # Chat history
ANALYTICS_RETENTION_DAYS=30  # Usage stats
FEEDBACK_RETENTION_DAYS=90   # User ratings
```

Automatic cleanup runs daily at midnight.

## Usage Limitations & Controls

### Rate Limiting (Public Kiosk Protection)
```javascript
// Per user/IP:
- 20 chat messages per minute
- 60 API requests per minute
- 5 login attempts per 15 minutes
```

### Response Controls
- **Max response length**: 500 tokens (~400 words)
- **Temperature**: 0.7 (balanced creativity/accuracy)
- **Timeout**: 120 seconds per request

### Content Filtering
The system is programmed to:
- Only answer school-related questions
- Redirect inappropriate topics
- Maintain focus on educational content

## Monitoring & Maintenance

### Health Check
```bash
npm run test:ollama
```

### View Logs
```bash
# Application logs
tail -f logs/app.log

# Ollama status
ollama ps
```

### Model Performance
```bash
# Check loaded models
ollama list

# Monitor resource usage
# Windows Task Manager / macOS Activity Monitor / Linux top
```

## Troubleshooting

### Issue: "Ollama not responding"
```bash
# Solution: Start Ollama
ollama serve

# Or check if it's already running
curl http://localhost:11434/api/tags
```

### Issue: Out of Memory
```bash
# Free up RAM
# 1. Close unnecessary applications
# 2. Use smaller model: ollama pull orca-mini:3b
# 3. Increase system RAM
```

### Issue: Slow Responses
```bash
# Enable GPU acceleration
# See OLLAMA_SETUP.md for your hardware

# Or reduce max tokens
OLLAMA_MAX_TOKENS=300  # Shorter responses = faster
```

### Issue: Database Connection Error
```bash
# Check MySQL is running
mysql -u root -p hologram

# Or disable database (in-memory storage)
DATABASE_TYPE=memory
```

## Advanced Configuration

### Using Different Models

**Faster (1.9GB):**
```bash
ollama pull orca-mini:3b
# OLLAMA_MODEL=orca-mini:3b
```

**More Capable (4.7GB):**
```bash
ollama pull neural-chat:7b
# OLLAMA_MODEL=neural-chat:7b
```

**Specialized:**
```bash
ollama pull codellama        # Programming
ollama pull mistral          # General knowledge
ollama pull solar             # Creative writing
```

### Performance Tuning

**Increase Speed (use CPU cores):**
```bash
OLLAMA_NUM_THREAD=4 ollama serve
```

**Keep Model in Memory:**
```bash
OLLAMA_KEEP_ALIVE=-1 ollama serve
```

**GPU Acceleration:**
- NVIDIA: Install CUDA Toolkit
- AMD: Use ROCm (Linux)
- Apple Silicon: Automatic

## Integration with School Systems

### Database Integration
Connect to existing school databases for:
- Faculty information
- Facility details
- Event schedules
- FAQ updates

### Authentication
- Admin panel for configuration
- User session management
- Role-based access control

### Analytics
Privacy-respecting usage analytics:
- Question topics (no content stored)
- Peak usage times
- Response quality ratings

## Updating & Maintenance

### Update Application
```bash
git pull origin main
npm install
npm run build
npm run db:migrate
npm start
```

### Update Model
```bash
# New version of Llama
ollama pull llama2:latest

# Then update OLLAMA_MODEL in .env
```

### Backup Database
```bash
# MySQL backup
mysqldump -u root hologram > backup.sql

# Restore
mysql -u root hologram < backup.sql
```

## Running Multiple Kiosks

### Shared Ollama Server (Recommended)
1. Set up Ollama on dedicated server machine
2. All kiosks connect to same Ollama instance
3. Update `.env` on all kiosks:
```dotenv
OLLAMA_API_URL=http://server-ip:11434
```

### Load Balancing (for large deployments)
```nginx
upstream ollama {
  server 192.168.1.10:11434;
  server 192.168.1.11:11434;
  server 192.168.1.12:11434;
}

server {
  listen 11434;
  location / {
    proxy_pass http://ollama;
  }
}
```

## Security Considerations

### Network Isolation
- Kiosk network: Isolated VLAN (optional)
- Ollama port 11434: Not accessible from internet
- HTTP only (HTTPS not required for local network)

### Access Control
- Admin password required for configuration
- Session timeout: 30 minutes
- Rate limiting on all endpoints

### Data Protection
- Automatic daily cleanup
- Optional encryption at rest
- No data sent externally

## Cost Analysis

### Yearly Operating Cost
```
Ollama/Llama Licensing: $0 (Open Source)
API Costs: $0 (Local)
Hosting: $0 (On-premise)
Support: $0 (Community)
─────────────────────────
Total: $0 per year per kiosk
```

Compared to cloud AI:
- Google AI: ~$0.001-0.01 per request → $50-500/month
- OpenAI: ~$0.002-0.02 per request → $100-1000/month
- **Ollama: $0/month** (after hardware cost)

## Support & Resources

- **Official Docs**: https://ollama.ai
- **Community Discord**: https://discord.gg/ollama
- **GitHub Issues**: https://github.com/ollama/ollama
- **Local Server**: See this repository's OLLAMA_SETUP.md

## Deployment Checklist

- [ ] Ollama installed and running
- [ ] Model downloaded: `ollama pull llama2:3b`
- [ ] `.env` file configured with Ollama settings
- [ ] Database (MySQL or in-memory) set up
- [ ] Application built: `npm run build`
- [ ] Health check passed: `npm run test:ollama`
- [ ] Tested in browser at `http://localhost:5001`
- [ ] Rate limiting configured appropriately
- [ ] Daily cleanup scheduled
- [ ] Backups configured
- [ ] Admin panel tested
- [ ] Ready for deployment ✅

## Next Steps

1. Read [OLLAMA_SETUP.md](./OLLAMA_SETUP.md) for detailed installation
2. Run setup script: `npm run setup:ollama` (Windows) or `npm run setup:ollama:unix` (Mac/Linux)
3. Test connectivity: `npm run test:ollama`
4. Start application: `npm run dev` (development) or `npm start` (production)
5. Access kiosk at configured port
6. Test with sample questions about your school
7. Configure admin panel with school information
8. Deploy to production when satisfied

Good luck with your offline, privacy-first school kiosk! 🚀
