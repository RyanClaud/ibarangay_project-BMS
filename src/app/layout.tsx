import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { AppProvider } from "@/contexts/app-context";
import { ThemeProvider } from "@/components/theme-provider";
import { GlobalErrorInterceptor } from "@/components/global-error-interceptor";
import { PWAInstallPrompt } from "@/components/pwa/install-prompt";

export const viewport: Viewport = {
  themeColor: "#102D56",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "iBarangay - Community Management",
  description: "Modernizing Community Management. Efficiently. Effectively.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "iBarangay",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-body antialiased")}>
        <ThemeProvider>
          <AppProvider>
            <GlobalErrorInterceptor />
            {children}
            <PWAInstallPrompt />
          </AppProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
