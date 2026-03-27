import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "The Watcher - Observability Dashboard",
  description: "AI-driven observability for microservices",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-100">
        <Navbar />
        <main className="max-w-[1440px] mx-auto px-6 pt-4 pb-2 h-[calc(100vh-64px)] overflow-hidden">{children}</main>
      </body>
    </html>
  );
}
