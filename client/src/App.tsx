import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import Hologram from "@/pages/Hologram";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

function Router() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Secret admin shortcut: Press Ctrl+Shift+A (or Cmd+Shift+A on Mac)
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setLocation('/secure-f4c71bebae51ab7a');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [setLocation]);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/secure-f4c71bebae51ab7a" component={Admin} />
      <Route path="/hologram" component={Hologram} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
