import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/AppShell";
import AuthPage from "./pages/Auth";
import DashboardPage from "./pages/Dashboard";
import FocusPage from "./pages/Focus";
import GoalsPage from "./pages/Goals";
import LeaderboardPage from "./pages/Leaderboard";
import RewardsPage from "./pages/Rewards";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="/app" element={<DashboardPage />} />
              <Route path="/app/focus" element={<FocusPage />} />
              <Route path="/app/goals" element={<GoalsPage />} />
              <Route path="/app/leaderboard" element={<LeaderboardPage />} />
              <Route path="/app/rewards" element={<RewardsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
