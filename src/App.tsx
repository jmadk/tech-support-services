
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProfileOnboardingGate from "@/components/site/ProfileOnboardingGate";
import Index from "./pages/Index";
import Lesson from "./pages/Lesson";
import TrainingEducation from "./pages/TrainingEducation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<ProfileOnboardingGate><Index /></ProfileOnboardingGate>} />
                <Route path="/training-education" element={<ProfileOnboardingGate><TrainingEducation /></ProfileOnboardingGate>} />
                <Route path="/lesson/:consultationId" element={<ProfileOnboardingGate><Lesson /></ProfileOnboardingGate>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
