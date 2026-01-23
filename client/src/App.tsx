import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import Hologram from "@/pages/Hologram";
import HologramNew from "@/pages/HologramNew";
import AvatarTest from "@/pages/AvatarTest";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

function Router() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Secret admin shortcut: Press Ctrl+Shift+A (or Cmd+Shift+A on Mac)
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setLocation('/institution-panel');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [setLocation]);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/institution-panel" component={Admin} />
      <Route path="/hologram" component={Hologram} />
      <Route path="/hologram-new" component={HologramNew} />
      <Route path="/avatar-test" component={AvatarTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
