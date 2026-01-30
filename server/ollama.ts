// Local Ollama integration for offline, privacy-first AI
import fetch from 'node-fetch';

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  repeat_penalty?: number;
  seed?: number;
  num_predict?: number;
  stream?: boolean;
  keep_alive?: string;
}

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration: number;
  load_duration: number;
  prompt_eval_count: number;
  eval_count: number;
  eval_duration: number;
}

export class OllamaClient {
  private baseUrl: string;
  private modelName: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(baseUrl: string = 'http://localhost:11434', modelName: string = 'llama2:3b') {
    this.baseUrl = baseUrl;
    this.modelName = modelName;
  }

  /**
   * Health check - verify Ollama is running and model is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      console.error('Ollama health check failed:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  /**
   * Check if specific model is available locally
   */
  async isModelAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        timeout: 5000,
      });
      
      if (!response.ok) {
        return false;
      }

      const data = await response.json() as { models: Array<{ name: string }> };
      const availableModels = data.models || [];
      
      // Check if our model is available (handle model variants)
      return availableModels.some(m => 
        m.name.startsWith(this.modelName.split(':')[0])
      );
    } catch (error) {
      console.error('Model availability check failed:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  /**
   * Send chat request to Ollama (non-streaming for simplicity)
   */
  async chat(
    messages: OllamaMessage[],
    temperature: number = 0.7,
    maxTokens: number = 500
  ): Promise<string> {
    const payload: OllamaChatRequest = {
      model: this.modelName,
      messages,
      temperature,
      top_p: temperature === 0.0 ? 0.0 : 0.9,  // If temperature is 0, also use top_p=0 for maximum strictness
      top_k: temperature === 0.0 ? 1 : 40,     // If temp=0, use top_k=1 for deterministic output
      repeat_penalty: 1.1,                      // Slightly penalize repetition
      seed: temperature === 0.0 ? 42 : undefined,  // Fixed seed for temp=0 ensures identical outputs
      num_predict: maxTokens,
      stream: false,
      keep_alive: "10m", // Keep model loaded in memory for faster responses
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          timeout: 300000, // 5 minutes for inference (increased from 2 min)
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Model "${this.modelName}" not found. Please pull the model first: ollama pull ${this.modelName}`);
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as OllamaChatResponse;
        return data.message.content.trim();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.maxRetries - 1) {
          console.log(`Ollama attempt ${attempt + 1} failed, retrying in ${this.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    throw lastError || new Error('Failed to get response from Ollama after retries');
  }

  /**
   * Stream chat response from Ollama (returns async generator for real-time tokens)
   */
  async *chatStream(
    messages: OllamaMessage[],
    temperature: number = 0.7,
    maxTokens: number = 500
  ): AsyncGenerator<string> {
    const payload: OllamaChatRequest = {
      model: this.modelName,
      messages,
      temperature,
      top_p: temperature === 0.0 ? 0.0 : 0.9,  // If temperature is 0, also use top_p=0 for maximum strictness
      top_k: temperature === 0.0 ? 1 : 40,     // If temp=0, use top_k=1 for deterministic output
      repeat_penalty: 1.1,                      // Slightly penalize repetition
      seed: temperature === 0.0 ? 42 : undefined,  // Fixed seed for temp=0 ensures identical outputs
      num_predict: maxTokens,
      stream: true,  // Enable streaming
      keep_alive: "10m",
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        timeout: 300000, // 5 minutes
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Use text streaming for better compatibility
      const text = await response.text();
      const lines = text.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const data = JSON.parse(trimmed) as OllamaChatResponse;
          if (data.message?.content) {
            yield data.message.content; // Yield token/text chunk
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    } catch (error) {
      throw new Error(`Stream failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async generate(
    prompt: string,
    temperature: number = 0.7,
    maxTokens: number = 500
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          prompt,
          temperature,
          num_predict: maxTokens,
          stream: false,
          keep_alive: "10m", // Keep model loaded in memory
        }),
        timeout: 300000, // 5 minutes
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as { response: string };
      return data.response.trim();
    } catch (error) {
      throw new Error(`Generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Pull/download a model from Ollama registry
   */
  async pullModel(): Promise<boolean> {
    try {
      console.log(`Pulling model ${this.modelName}...`);
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: this.modelName,
          stream: false,
        }),
        timeout: 600000, // 10 minutes for model download
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`Model ${this.modelName} pulled successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to pull model ${this.modelName}:`, error instanceof Error ? error.message : error);
      return false;
    }
  }

  /**
   * Set model name (supports model tags like "llama3.2:3b")
   */
  setModel(modelName: string): void {
    this.modelName = modelName;
  }

  /**
   * Get current model name
   */
  getModel(): string {
    return this.modelName;
  }

  /**
   * Set base URL (for remote Ollama instances)
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Default singleton instance
export const ollama = new OllamaClient(
  process.env.OLLAMA_API_URL || 'http://localhost:11434',
  process.env.OLLAMA_MODEL || 'llama2:3b'
);

/**
 * Initialize Ollama on startup - verify connection and model availability
 */
export async function initializeOllama(): Promise<{ ready: boolean; message: string }> {
  try {
    // Check health
    const isHealthy = await ollama.healthCheck();
    if (!isHealthy) {
      return {
        ready: false,
        message: 'Ollama server is not running. Start it with: ollama serve',
      };
    }

    // Check model availability
    const modelAvailable = await ollama.isModelAvailable();
    if (!modelAvailable) {
      console.log(`Model ${ollama.getModel()} not found locally. Attempting to pull...`);
      const pulled = await ollama.pullModel();
      if (!pulled) {
        return {
          ready: false,
          message: `Model ${ollama.getModel()} not available. Install with: ollama pull ${ollama.getModel()}`,
        };
      }
    }

    return {
      ready: true,
      message: `Ollama ready with model ${ollama.getModel()}`,
    };
  } catch (error) {
    return {
      ready: false,
      message: `Ollama initialization failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export default ollama;
