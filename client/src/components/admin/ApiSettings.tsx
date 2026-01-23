import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Save, RefreshCw } from "lucide-react";

interface ApiConfig {
  grokApiKey: string;
  grokModel: string;
  ttsProvider: string;
  ttsApiKey: string;
}

export function ApiSettings() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ApiConfig>({
    grokApiKey: "",
    grokModel: "llama-3.3-70b-versatile",
    ttsProvider: "google",
    ttsApiKey: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showGrokKey, setShowGrokKey] = useState(false);
  const [showTtsKey, setShowTtsKey] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/admin/config", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      toast({
        title: "Error loading configuration",
        description: "Failed to load API settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter your password to confirm changes",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...config, password }),
      });

      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "API configuration updated successfully",
        });
        setPassword("");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to save settings");
      }
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "Failed to update API configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex gap-2">
          {[0, 0.2, 0.4].map((delay, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-[hsl(48,100%,50%)] animate-pulse"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-[hsl(48,100%,50%)]/20">
        <CardHeader>
          <CardTitle className="text-[hsl(48,100%,50%)]">Groq API Settings</CardTitle>
          <CardDescription>Configure AI model and API credentials for Groq</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grokApiKey">Groq API Key</Label>
            <div className="flex gap-2">
              <Input
                id="grokApiKey"
                type={showGrokKey ? "text" : "password"}
                value={config.grokApiKey}
                onChange={(e) => setConfig({ ...config, grokApiKey: e.target.value })}
                placeholder="Enter your Groq API key"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowGrokKey(!showGrokKey)}
                className="border-[hsl(48,100%,50%)]/40"
              >
                {showGrokKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grokModel">Model</Label>
            <Input
              id="grokModel"
              value={config.grokModel}
              onChange={(e) => setConfig({ ...config, grokModel: e.target.value })}
              placeholder="e.g., llama-3.3-70b-versatile"
            />
            <p className="text-xs text-muted-foreground">
              Available models: llama-3.3-70b-versatile, llama-3.1-70b-versatile, mixtral-8x7b-32768
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[hsl(48,100%,50%)]/20">
        <CardHeader>
          <CardTitle className="text-[hsl(48,100%,50%)]">Text-to-Speech Settings</CardTitle>
          <CardDescription>Configure TTS provider and credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ttsProvider">TTS Provider</Label>
            <select
              id="ttsProvider"
              value={config.ttsProvider}
              onChange={(e) => setConfig({ ...config, ttsProvider: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="google">Google Cloud TTS</option>
              <option value="elevenlabs">ElevenLabs</option>
              <option value="azure">Azure TTS</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ttsApiKey">TTS API Key</Label>
            <div className="flex gap-2">
              <Input
                id="ttsApiKey"
                type={showTtsKey ? "text" : "password"}
                value={config.ttsApiKey}
                onChange={(e) => setConfig({ ...config, ttsApiKey: e.target.value })}
                placeholder="Enter your TTS API key"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowTtsKey(!showTtsKey)}
                className="border-[hsl(48,100%,50%)]/40"
              >
                {showTtsKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[hsl(48,100%,50%)]/20 bg-[hsl(0,75%,15%)]/50">
        <CardHeader>
          <CardTitle className="text-[hsl(48,100%,50%)] text-lg">Confirm Changes</CardTitle>
          <CardDescription>Enter your password to save API configuration changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Your Password</Label>
            <div className="flex gap-2">
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password to confirm"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="border-[hsl(48,100%,50%)]/40"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[hsl(48,100%,50%)] text-[hsl(0,75%,25%)] hover:bg-[hsl(48,100%,60%)]"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={loadConfig}
          disabled={isSaving}
          className="border-[hsl(48,100%,50%)]/40"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );
}
