import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { FirmProvider } from "@/context/FirmContext";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Law Firm Operating System",
  description: "Survival and Recovery System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, "antialiased bg-background text-foreground flex min-h-screen")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FirmProvider>
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header for Mode Toggle */}
              <header className="flex justify-end p-4 border-b">
                <ModeToggle />
              </header>
              <div className="flex-1 overflow-auto">
                {children}
              </div>
            </div>
          </FirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
