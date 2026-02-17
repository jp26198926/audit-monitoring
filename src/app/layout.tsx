import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ClientToaster from "@/components/ClientToaster";

export const metadata: Metadata = {
  title: "Audit Monitoring System",
  description: "Internal company web-based system for audit monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
          <ClientToaster />
        </AuthProvider>
      </body>
    </html>
  );
}
