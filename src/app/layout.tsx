import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brand Forge",
  description: "Plataforma de generación de assets de marca",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
