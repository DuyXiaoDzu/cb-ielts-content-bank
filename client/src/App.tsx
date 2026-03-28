import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Planning from "./pages/Planning";
import Ideas from "./pages/Ideas";
import Optional from "./pages/Optional";
import Videos from "./pages/Videos";
import BacklogPage from "./pages/Backlog";
import Metrics from "./pages/Metrics";
import SettingsPage from "./pages/Settings";
import Whiteboard from "./pages/Whiteboard";
import Copywriting from "./pages/Copywriting";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/planning" component={Planning} />
        <Route path="/ideas" component={Ideas} />
        <Route path="/optional" component={Optional} />
        <Route path="/videos" component={Videos} />
        <Route path="/backlog" component={BacklogPage} />
        <Route path="/metrics" component={Metrics} />
        <Route path="/whiteboard" component={Whiteboard} />
        <Route path="/copywriting" component={Copywriting} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
