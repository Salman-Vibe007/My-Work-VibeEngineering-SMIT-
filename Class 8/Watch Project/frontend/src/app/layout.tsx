import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import LayoutSwitcher from "@/components/LayoutSwitcher";

export const metadata: Metadata = {
  title: "Chronos Watch Store | Premium Timepieces",
  description: "Discover premium wristwatches from world-renowned brands. Shop mechanical, quartz, and smartwatches with secure checkout.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased" suppressHydrationWarning>
        <AuthProvider>
          <LayoutSwitcher>{children}</LayoutSwitcher>
        </AuthProvider>
      </body>
    </html>
  );
}
