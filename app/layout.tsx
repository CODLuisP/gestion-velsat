import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestión Velsat",
  icons: {
    icon: "/logoVelsat.ico",
    shortcut: "/logoVelsat.ico",
    apple: "/logoVelsat.ico",
  },
  other: {
    google: "notranslate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" translate="no" className="notranslate">
      <body
        className="antialiased bg-[#121214] text-[#ECECEE]"
        style={{
          fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: "13.5px",
        }}
      >
        {children}
      </body>
    </html>
  );
}
