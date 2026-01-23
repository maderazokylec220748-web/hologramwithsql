import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MonitorPlay } from "lucide-react";
import { Link } from "wouter";
import logoImage from "@assets/image_1760701271607.png";

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Login failed");
      }

      toast({ title: "Login successful" });
      onLoginSuccess();
    } catch (error) {
      toast({
        title: "Login failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(0,75%,10%)] via-[hsl(0,60%,8%)] to-[hsl(48,30%,10%)]">
      {/* Back buttons - positioned at top */}
      <div className="absolute top-4 left-4 flex gap-2">
        <Link href="/">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(48,100%,50%)]/10 to-[hsl(0,75%,50%)]/10 border-[hsl(48,100%,50%)]/40 text-[hsl(48,100%,50%)] hover:text-[hsl(48,100%,70%)] hover:bg-[hsl(48,100%,50%)]/20 hover:border-[hsl(48,100%,50%)]/60 transition-all shadow-lg hover:shadow-[hsl(48,100%,50%)]/20 hover:scale-105"
            title="Back to Home"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Button
          variant="outline"
          size="icon"
          onClick={() => window.open('/hologram-new', '_blank', 'width=1200,height=800')}
          className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(280,100%,50%)]/10 to-[hsl(48,100%,50%)]/10 border-[hsl(48,100%,50%)]/40 text-[hsl(48,100%,50%)] hover:text-[hsl(48,100%,70%)] hover:bg-[hsl(48,100%,50%)]/20 hover:border-[hsl(48,100%,50%)]/60 transition-all shadow-lg hover:shadow-[hsl(48,100%,50%)]/20 hover:scale-105"
          title="Open Hologram Display"
        >
          <MonitorPlay className="h-5 w-5" />
        </Button>
      </div>

      <Card className="w-full max-w-md border-[hsl(48,100%,50%)]">
        <CardHeader className="text-center space-y-4">
          <img src={logoImage} alt="Westmead" className="h-16 mx-auto" />
          <CardTitle className="text-2xl font-display">Admin Login</CardTitle>
          <CardDescription>
            Access the Westmead AI Admin Panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                data-testid="input-login-username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                data-testid="input-login-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[hsl(48,100%,50%)] text-[hsl(0,75%,25%)] hover:bg-[hsl(48,100%,60%)]"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
