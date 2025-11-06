import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, HelpCircle, Users, LogOut } from "lucide-react";
import { QueryDashboard } from "@/components/admin/QueryDashboard";
import { FaqManager } from "@/components/admin/FaqManager";
import { UserManager } from "@/components/admin/UserManager";
import { LoginForm } from "@/components/admin/LoginForm";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/image_1760701271607.png";

export default function Admin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("queries");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      setIsAuthenticated(response.ok);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setIsAuthenticated(false);
      toast({ title: "Logged out successfully" });
    } catch (error) {
      toast({ title: "Logout failed", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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

  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-[hsl(48,100%,50%)] bg-[hsl(0,75%,25%)]">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-4">
              <img src={logoImage} alt="Westmead" className="h-10 sm:h-12" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold font-display text-[hsl(45,30%,98%)]">
                  WIS AI Admin Panel
                </h1>
                <p className="text-xs sm:text-sm text-[hsl(45,20%,80%)]">
                  Manage chatbot queries, FAQs, and users
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Link href="/" className="flex-1 sm:flex-none">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-[hsl(48,100%,50%)] text-[hsl(45,30%,98%)] hover:bg-[hsl(48,100%,50%)] hover:text-[hsl(0,75%,25%)] text-sm"
                  data-testid="link-home"
                >
                  <ArrowLeft className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Chatbot</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex-1 sm:flex-none border-[hsl(48,100%,50%)] text-[hsl(48,100%,50%)] hover:bg-[hsl(48,100%,50%)] hover:text-[hsl(0,75%,25%)] text-sm"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-4 sm:mb-8">
            <TabsTrigger value="queries" className="gap-1 sm:gap-2 text-xs sm:text-sm" data-testid="tab-queries">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Queries</span>
              <span className="sm:hidden">Data</span>
            </TabsTrigger>
            <TabsTrigger value="faqs" className="gap-1 sm:gap-2 text-xs sm:text-sm" data-testid="tab-faqs">
              <HelpCircle className="w-4 h-4" />
              FAQs
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1 sm:gap-2 text-xs sm:text-sm" data-testid="tab-users">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queries" className="mt-0">
            <QueryDashboard />
          </TabsContent>

          <TabsContent value="faqs" className="mt-0">
            <FaqManager />
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <UserManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
