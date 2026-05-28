import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/provider";
import Image from "next/image";
import NavBar from "./navbar";
import LangToggle from "./lang-toggle";
import FloatingParticles from "./components/floating-particles";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Monitorías - Jose Gilberto Soler Callejas",
  description:
    "Sistema de agendamiento de monitorías para estudiantes de medicina - Universidad del Tolima",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative">
        <FloatingParticles />
        <I18nProvider>
          <NavBar />
          <main className="flex-1 relative z-10">{children}</main>
          <footer className="relative z-10 border-t border-border/60 bg-white py-8 text-center text-sm text-zinc-400">
            <div className="mx-auto max-w-6xl px-4">
              <p className="mb-1">
                &copy; {new Date().getFullYear()} Jose Gilberto Soler Callejas
              </p>
              <p className="text-xs text-zinc-300 flex items-center justify-center gap-1.5">
                <Image
                  src="/logo-tolima.png"
                  alt="Universidad del Tolima"
                  width={16}
                  height={16}
                  className="inline-block"
                />
                Universidad del Tolima - Facultad de Medicina
              </p>
            </div>
          </footer>
          <LangToggle />
        </I18nProvider>
      </body>
    </html>
  );
}
