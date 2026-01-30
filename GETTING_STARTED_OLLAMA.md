# 🚀 Getting Started with Offline AI Kiosk

## What You Have

Your school now has a **text-only, offline AI assistant** that:
- ✅ Works completely offline (after model download)
- ✅ Costs $0/month (no subscriptions)
- ✅ Respects all privacy laws (COPPA, GDPR, FERPA)
- ✅ Never sends data externally
- ✅ Can handle unlimited questions

## Quick Setup (5 Minutes)

### Step 1: Install Ollama
1. Go to https://ollama.ai
2. Download for your OS (Windows/Mac/Linux)
3. Run the installer
4. It will start automatically (or run `ollama serve`)

### Step 2: Download the AI Model
```bash
ollama pull llama2:3b
```
This downloads 3.5GB once. Takes 5-10 minutes depending on internet.

### Step 3: Configure
Create or edit `.env` file:
```dotenv
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama2:3b
```

### Step 4: Start
```bash
npm install
npm run build
npm start
```

### Step 5: Use
Open browser → `http://localhost:5001`

## Documentation

**New to this system?**
→ Start with [OLLAMA_SETUP.md](./OLLAMA_SETUP.md) for step-by-step installation

**Deploying to school?**
→ Read [TEXT_ONLY_DEPLOYMENT.md](./TEXT_ONLY_DEPLOYMENT.md) for complete guide

**Quick technical summary?**
→ See [OLLAMA_INTEGRATION_SUMMARY.md](./OLLAMA_INTEGRATION_SUMMARY.md)

## What Changed

- ✅ AI now runs **locally** (was using Groq cloud API)
- ✅ Uses **Llama 3.2:3b** model (open-source)
- ✅ **Text-only** interface (no images)
- ✅ **Zero external calls** (complete privacy)
- ✅ **Unlimited usage** (no API limits)
- ✅ **No subscriptions** (all free)

## Key Files

| File | Purpose |
|------|---------|
| `server/ollama.ts` | AI backend integration |
| `OLLAMA_SETUP.md` | Installation guide |
| `TEXT_ONLY_DEPLOYMENT.md` | Full deployment guide |
| `scripts/setup-ollama.ps1` | Windows auto-setup |
| `scripts/setup-ollama.sh` | Mac/Linux auto-setup |
| `.env.example` | Configuration template |

## Common Commands

```bash
# Setup Ollama automatically
npm run setup:ollama:windows   # Windows
npm run setup:ollama:unix      # Mac/Linux

# Verify everything works
npm run test:ollama

# Development mode
npm run dev

# Production mode
npm run build && npm start

# Check Ollama status
ollama ps
```

## Hardware Needed

**Minimum:**
- RAM: 4GB
- CPU: Any modern processor
- Storage: 10GB

**Recommended:**
- RAM: 8GB
- CPU: Intel i7 or equivalent
- Storage: 20GB SSD

**Cost:** $300-800 for a used computer ✅ (One-time cost)

## Privacy Protection

All of the following are **built-in**:

✅ **No data sent outside** (GDPR compliant)
✅ **Automatic cleanup** (FERPA compliant)
✅ **No tracking** (COPPA compliant)
✅ **Data stays local** (On-premise only)

## Troubleshooting

**Problem:** "Ollama not responding"
**Solution:**
```bash
ollama serve
```

**Problem:** "Model not found"
**Solution:**
```bash
ollama pull llama2:3b
```

**Problem:** "Out of memory"
**Solution:** Use smaller model or add RAM

See [OLLAMA_SETUP.md](./OLLAMA_SETUP.md) for more help.

## Support

- **Setup help** → [OLLAMA_SETUP.md](./OLLAMA_SETUP.md)
- **Deployment** → [TEXT_ONLY_DEPLOYMENT.md](./TEXT_ONLY_DEPLOYMENT.md)
- **Technical details** → [OLLAMA_INTEGRATION_SUMMARY.md](./OLLAMA_INTEGRATION_SUMMARY.md)
- **Official Ollama** → https://ollama.ai

## Next Steps

1. Install Ollama: https://ollama.ai
2. Download model: `ollama pull llama2:3b`
3. Configure: Create `.env` (copy from `.env.example`)
4. Test: `npm run test:ollama`
5. Start: `npm run dev` or `npm start`
6. Access: `http://localhost:5001`

---

**Questions?** See the documentation files or visit https://ollama.ai for community support.

**Ready to launch?** Your offline AI kiosk is ready! 🎉
