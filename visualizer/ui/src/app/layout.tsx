import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "The Watcher",
  description: "AI-driven observability dashboard for the microservices stack",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const themeBootScript = `
    (() => {
      const key = "watcher-theme-mode";
      const stored = localStorage.getItem(key);
      const mode = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
      const resolved = mode === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : mode;
      document.documentElement.setAttribute("data-theme", resolved);
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <div className="app-shell">
          <Sidebar />
          <main className="hide-scrollbar min-h-0 flex-1 overflow-auto px-5 pb-5 md:px-6 md:pb-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
