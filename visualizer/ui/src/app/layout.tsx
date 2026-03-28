import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "The Watcher",
  description: "AI-driven observability dashboard for the microservices stack",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="h-full w-full p-4 md:p-6">
          <div className="app-shell">
            <Sidebar />
            <main className="min-h-0 flex-1 overflow-hidden px-4 pb-4 md:px-6 md:pb-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
