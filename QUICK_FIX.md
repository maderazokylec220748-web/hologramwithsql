# 🚀 Quick Fix Guide - Stop AI Hallucination

## Problem
AI invents "Dr. John S. Mendoza, Jr." instead of saying "Prof. Rosana De Chavez" (the correct CITCS Dean from your database).

## Root Cause
**tinyllama model is too small/weak** - it cannot follow complex instructions and hallucin ates.

## Solution (10 Minutes)

### Step 1: Download Better Model (5-8 min)
Open PowerShell and run:
```powershell
ollama pull llama3.2:3b
```
*Downloads 3.5GB - wait for completion*

### Step 2: Update Configuration (30 seconds)
Open file: `.env`

Find this line:
```env
OLLAMA_MODEL=tinyllama
```

Change to:
```env
OLLAMA_MODEL=llama3.2:3b
```

Save the file.

### Step 3: Restart Server (1 min)
In terminal:
1. Press `Ctrl+C` to stop current server
2. Run: `npm run dev`
3. Wait for "serving on port 5002"

### Step 4: Test
Visit: http://localhost:3000

Ask: **"Who is the dean of CITCS?"**

✅ Expected: "Prof. Rosana De Chavez"  
❌ Before: "Dr. John S. Mendoza, Jr..." (hallucination)

## Alternative: Faster Model (If RAM Limited)

If llama3.2:3b is too slow, use phi3:mini (2.3GB):
```powershell
ollama pull phi3:mini
```
Then set in `.env`:
```env
OLLAMA_MODEL=phi3:mini
```

## Why This Works

| Model | Can Follow Instructions? | Hallucinates? |
|-------|-------------------------|---------------|
| tinyllama | ❌ NO | ✅ YES (often) |
| llama3.2:3b | ✅ YES | ❌ NO |
| phi3:mini | ✅ YES | ❌ NO |

## Verification

After fixing, the AI should:
- ✅ Answer from database only
- ✅ Say "Information not found in the database" when data is missing
- ✅ Never invent names, dates, or details
- ✅ Give short, factual answers

## Done!

Your AI will now use ONLY your database and stop hallucinating.

---

**Need Help?** See `COMPLETE_ANALYSIS.md` for technical details.
