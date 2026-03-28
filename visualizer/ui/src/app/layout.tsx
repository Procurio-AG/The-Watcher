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
      <body className="h-screen overflow-hidden bg-[#f3f1ee] text-slate-900">
        <div className="flex h-full w-full flex-col overflow-hidden bg-[#f8f7f4]">
          <Navbar />
          <main className="min-h-0 flex-1 px-6 pb-6 pt-2">{children}</main>
        </div>
      </body>
    </html>
  );
}
