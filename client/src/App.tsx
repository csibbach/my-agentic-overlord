import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import ApiDocs from "@/pages/api-docs";
import { ThemeToggle } from "@/components/theme-toggle";
import { LayoutDashboard, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/api-docs" component={ApiDocs} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard, testId: "link-dashboard" },
    { path: "/api-docs", label: "API Docs", icon: FileText, testId: "link-api-docs" },
  ];

  return (
    <nav className="border-b bg-card">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-foreground hover-elevate active-elevate-2 px-3 py-2 rounded-md -ml-3" data-testid="link-home">
            <div className="bg-primary text-primary-foreground rounded-md p-1.5">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            TaskRoute
          </Link>
          
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors hover-elevate active-elevate-2",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                  data-testid={item.testId}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <ThemeToggle />
      </div>
    </nav>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Navigation />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
