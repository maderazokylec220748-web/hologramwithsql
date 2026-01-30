#!/bin/bash

# Ollama Setup Script for macOS/Linux
# This script automates Ollama installation and model download for the school kiosk

set -e

MODEL="${1:-llama2:3b}"
SKIP_OLLAMA_INSTALL="${SKIP_OLLAMA_INSTALL:-false}"
SKIP_MODEL_DOWNLOAD="${SKIP_MODEL_DOWNLOAD:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

info() {
    echo -e "${CYAN}ℹ️  $@${NC}"
}

success() {
    echo -e "${GREEN}✅ $@${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $@${NC}"
}

error() {
    echo -e "${RED}❌ $@${NC}"
}

echo -e "${MAGENTA}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║   Ollama Setup for WIS AI School Kiosk           ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check for Ollama Installation
info "Step 1: Checking for Ollama..."

UNAME_S=$(uname -s)

if command -v ollama &> /dev/null; then
    success "Ollama is already installed: $(which ollama)"
    OLLAMA_INSTALLED=true
elif [ "$SKIP_OLLAMA_INSTALL" = "false" ]; then
    info "Ollama not found. Installing..."
    
    case "$UNAME_S" in
        Darwin)
            # macOS
            info "Downloading Ollama for macOS..."
            if ! curl -L https://ollama.ai/download/Ollama-darwin.zip -o /tmp/Ollama.zip 2>/dev/null; then
                error "Failed to download Ollama for macOS"
                info "Please download manually from https://ollama.ai"
                exit 1
            fi
            
            info "Extracting and installing..."
            unzip -q /tmp/Ollama.zip -d /tmp/
            mv /tmp/Ollama.app /Applications/ 2>/dev/null || warning "Could not move to /Applications (already exists?)"
            success "Ollama installed for macOS"
            info "Starting Ollama..."
            open /Applications/Ollama.app &
            ;;
        Linux)
            # Linux
            if [ -f /etc/os-release ]; then
                . /etc/os-release
                case "$ID" in
                    ubuntu|debian)
                        info "Installing on Ubuntu/Debian..."
                        curl -fsSL https://ollama.ai/install.sh | sh
                        ;;
                    *)
                        warning "Unsupported Linux distribution: $ID"
                        info "Please install Ollama manually from https://ollama.ai"
                        ;;
                esac
            else
                error "Could not detect Linux distribution"
                info "Please install Ollama manually from https://ollama.ai"
                exit 1
            fi
            success "Ollama installed for Linux"
            ;;
        *)
            error "Unsupported OS: $UNAME_S"
            exit 1
            ;;
    esac
else
    warning "Ollama installation skipped. Please install manually from https://ollama.ai"
fi

# Step 2: Wait for Ollama Service
echo ""
info "Step 2: Verifying Ollama service..."

MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        success "Ollama is running and responding on port 11434"
        break
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
        info "Waiting for Ollama to start... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
        sleep 2
    else
        error "Ollama is not responding after $MAX_ATTEMPTS attempts."
        warning "Please ensure Ollama is running by:"
        info "  1. macOS: open /Applications/Ollama.app"
        info "  2. Linux: ollama serve (in another terminal)"
        info "  3. Then run this script again"
        exit 1
    fi
done

# Step 3: Download Model
if [ "$SKIP_MODEL_DOWNLOAD" = "false" ]; then
    echo ""
    info "Step 3: Downloading model '$MODEL'..."
    warning "First time download may take several minutes depending on internet speed."
    
    if curl -X POST http://localhost:11434/api/pull \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"$MODEL\",\"stream\":false}" \
        --max-time 600 > /dev/null 2>&1; then
        success "Model '$MODEL' downloaded successfully!"
    else
        error "Failed to download model: $MODEL"
        info "Try manually downloading with:"
        info "  ollama pull $MODEL"
        exit 1
    fi
fi

# Step 4: Verify Model
echo ""
info "Step 4: Verifying installed models..."

MODELS=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4)

if [ -n "$MODELS" ]; then
    success "Available models:"
    echo "$MODELS" | while read -r model; do
        echo -e "${GREEN}  • $model${NC}"
    done
else
    warning "No models found. Please run: ollama pull $MODEL"
fi

# Step 5: Configuration
echo ""
info "Step 5: Configuration recommendations..."
echo ""
info "Add these to your .env file:"
echo -e "${YELLOW}  OLLAMA_API_URL=http://localhost:11434${NC}"
echo -e "${YELLOW}  OLLAMA_MODEL=$MODEL${NC}"

# Step 6: Test Chat
echo ""
info "Step 6: Testing Ollama chat..."

RESPONSE=$(curl -s -X POST http://localhost:11434/api/chat \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"$MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello!\"}],\"stream\":false}" \
    -m 120 | grep -o '"content":"[^"]*"' | cut -d'"' -f4 | head -1)

if [ -n "$RESPONSE" ]; then
    success "Ollama is working! Sample response:"
    echo -e "${CYAN}  $RESPONSE${NC}"
else
    warning "Chat test inconclusive (model may still be loading)"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Setup Complete! Ready to start the kiosk        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
info "Next steps:"
echo -e "${NC}  1. Make sure Ollama is running"
echo -e "${NC}  2. Update .env with configuration (see above)"
echo -e "${NC}  3. Run: npm run dev"
echo -e "${NC}  4. Open: http://localhost:5173"
echo ""
info "Documentation: See OLLAMA_SETUP.md for detailed information"
echo ""
