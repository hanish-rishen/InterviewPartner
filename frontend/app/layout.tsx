import type { Metadata } from "next";
import "@fontsource/host-grotesk/400.css";
import "@fontsource/host-grotesk/500.css";
import "@fontsource/host-grotesk/600.css";
import "@fontsource/host-grotesk/700.css";
import "@fontsource/host-grotesk/800.css";
import "./globals.css";
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: "Interview Partner | AI Mock Interviews",
  description: "Master your interview skills with an adaptive AI partner.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground selection:bg-primary/10 selection:text-primary">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
