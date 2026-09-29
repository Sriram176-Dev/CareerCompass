import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/hooks/useAuth";
import AccessibilityMenu from "@/components/layout/AccessibilityMenu";
import DailyCheckIn from "@/components/layout/DailyCheckIn";
import OfflineBanner from "@/components/layout/OfflineBanner";
import PWAInstallBanner from "@/components/layout/PWAInstallBanner";
import { PageProgressBar } from "@/components/common/MicroInteractions";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useKonamiCode } from "@/hooks/useKonamiCode";
import { AppRouter } from "./router";

const queryClient = new QueryClient();

function AppShell() {
  usePerformanceMonitor();
  useKonamiCode();

  return (
    <>
      <PageProgressBar />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "hsl(0 0% 7.8%)",
            color: "hsl(0 0% 96%)",
            border: "1px solid hsl(0 0% 11.8%)",
            borderRadius: "12px",
          },
        }}
      />
      <BrowserRouter>
        <OfflineBanner />
        <DailyCheckIn />
        <AppRouter />
      </BrowserRouter>
      <AccessibilityMenu />
      <PWAInstallBanner />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </QueryClientProvider>
  );
}
