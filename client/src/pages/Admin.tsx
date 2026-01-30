import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, HelpCircle, Users, LogOut, BookOpen, Building2, Calendar } from "lucide-react";
import { QueryDashboard } from "@/components/admin/QueryDashboard";
import { FaqManager } from "@/components/admin/FaqManager";
import { ProfessorsManager } from "@/components/admin/ProfessorsManager";
import { FacilitiesManager } from "@/components/admin/FacilitiesManager";
import { EventsManager } from "@/components/admin/EventsManager";
import { UserManager } from "@/components/admin/UserManager";
import { LoginForm } from "@/components/admin/LoginForm";
import { AnalyticsDashboard } from "@/pages/AnalyticsDashboard";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/image_1760701271607.png";

export default function Admin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("analytics");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; role: string } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
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
    return <LoginForm onLoginSuccess={() => {
      setIsAuthenticated(true);
      checkAuth(); // Re-fetch user data after login
    }} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-[hsl(48,100%,50%)] bg-[hsl(0,75%,25%)]">
        <div className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4 flex-1">
              <img src={logoImage} alt="Westmead" className="h-10 sm:h-12" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold font-display text-[hsl(45,30%,98%)]">
                  WIS AI Admin Panel
                </h1>
                <p className="text-xs sm:text-sm text-[hsl(45,20%,80%)]">
                  {currentUser && (
                    <span className="inline-block">
                      Logged in as: <span className="font-semibold text-[hsl(48,100%,50%)]">{currentUser.username}</span>
                      {' '}({currentUser.role})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/" className="flex-1 sm:flex-none">
                <Button
                  variant="outline"
                  className="border-[hsl(48,100%,50%)] text-[hsl(45,30%,98%)] hover:bg-[hsl(48,100%,50%)] hover:text-[hsl(0,75%,25%)] text-sm"
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
                className="border-[hsl(48,100%,50%)] text-[hsl(48,100%,50%)] hover:bg-[hsl(48,100%,50%)] hover:text-[hsl(0,75%,25%)] text-sm"
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

      {/* Main Content with Sidebar */}
      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <div className="w-48 bg-slate-50 border-r border-slate-200 overflow-y-auto">
          <div className="p-4 space-y-2">
            {/* Analytics */}
            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === "analytics"
                  ? "bg-[hsl(0,75%,25%)] text-white"
                  : "text-slate-700 hover:bg-slate-200"
              }`}
              data-testid="tab-analytics"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Analytics</span>
            </button>

            {/* Queries - Available to All Roles */}
            <div className="pt-2 pb-1">
              <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Reports</p>
            </div>

            <button
              onClick={() => setActiveTab("queries")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === "queries"
                  ? "bg-[hsl(0,75%,25%)] text-white"
                  : "text-slate-700 hover:bg-slate-200"
              }`}
              data-testid="tab-queries"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Queries</span>
            </button>

            {/* Admin Only Modules */}
            {currentUser?.role === 'admin' && (
              <>
                <div className="pt-2 pb-1">
                  <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Admin Modules</p>
                </div>

                <button
                  onClick={() => setActiveTab("faqs")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                    activeTab === "faqs"
                      ? "bg-[hsl(0,75%,25%)] text-white"
                      : "text-slate-700 hover:bg-slate-200"
                  }`}
                  data-testid="tab-faqs"
                >
                  <HelpCircle className="w-5 h-5" />
                  <span>FAQs</span>
                </button>

                <button
                  onClick={() => setActiveTab("professors")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                    activeTab === "professors"
                      ? "bg-[hsl(0,75%,25%)] text-white"
                      : "text-slate-700 hover:bg-slate-200"
                  }`}
                  data-testid="tab-professors"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Professors</span>
                </button>

                <button
                  onClick={() => setActiveTab("facilities")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                    activeTab === "facilities"
                      ? "bg-[hsl(0,75%,25%)] text-white"
                      : "text-slate-700 hover:bg-slate-200"
                  }`}
                  data-testid="tab-facilities"
                >
                  <Building2 className="w-5 h-5" />
                  <span>Facilities</span>
                </button>

                <button
                  onClick={() => setActiveTab("events")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                    activeTab === "events"
                      ? "bg-[hsl(0,75%,25%)] text-white"
                      : "text-slate-700 hover:bg-slate-200"
                  }`}
                  data-testid="tab-events"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Events</span>
                </button>
              </>
            )}

            {/* General Modules */}
            <div className="pt-2 pb-1">
              <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">General</p>
            </div>

            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === "users"
                  ? "bg-[hsl(0,75%,25%)] text-white"
                  : "text-slate-700 hover:bg-slate-200"
              }`}
              data-testid="tab-users"
            >
              <Users className="w-5 h-5" />
              <span>Users</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {activeTab === "analytics" && <AnalyticsDashboard />}

            {activeTab === "queries" && <QueryDashboard />}

            {activeTab === "faqs" && currentUser?.role === 'admin' && <FaqManager />}

            {activeTab === "professors" && currentUser?.role === 'admin' && <ProfessorsManager />}

            {activeTab === "facilities" && currentUser?.role === 'admin' && <FacilitiesManager />}

            {activeTab === "events" && currentUser?.role === 'admin' && <EventsManager />}

            {activeTab === "users" && <UserManager currentUser={currentUser} />}
          </div>
        </div>
      </div>
    </div>
  );
}
