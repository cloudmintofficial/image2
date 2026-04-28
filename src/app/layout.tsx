import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";

import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Medfile Labs — Laboratory Information Management System",
  description: "Modern LIMS for diagnostic centers — manage patients, orders, billing, lab results, and reports.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <ThemeProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
